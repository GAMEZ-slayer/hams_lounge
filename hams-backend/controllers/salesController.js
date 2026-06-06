const axios = require('axios');
const { sequelize, QueryTypes, mpesaAgent } = require('../config/db');

const getMpesaToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY || "ygrA2MphNJvA6k5vZJxcroIbAM6cJJ2fEkPYGIDDOKcnaJ4L";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "6whAn747XcbAAiJGnhBL5hAfaQWR8BxMeo8aZdypRtr08trtPDArHjYeDlmk3283";
  const secret = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${secret}` },
    httpsAgent: mpesaAgent
  });
  return response.data.access_token;
};

exports.processCheckout = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, total_amount, payment_method, phone_number } = req.body;

    if (payment_method === "MPESA" && phone_number) {
      try {
        let formattedPhone = phone_number.replace(/\s+/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+254')) {
          formattedPhone = formattedPhone.substring(1);
        }

        const accessToken = await getMpesaToken();
        const date = new Date();
        const timestamp =
          date.getFullYear() +
          ("0" + (date.getMonth() + 1)).slice(-2) +
          ("0" + date.getDate()).slice(-2) +
          ("0" + date.getHours()).slice(-2) +
          ("0" + date.getMinutes()).slice(-2) +
          ("0" + date.getSeconds()).slice(-2);

        const shortcode = "174379";
        const passkey = "bfb27292b3c10d64e742ca514f11467b3434b558b398e02b6615742a27b14d5e";
        const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');
        const callbackUrl = process.env.MPESA_CALLBACK_URL || "https://mydomain.com/api/mpesa/callback";
        const finalAmount = Math.round(total_amount);

        await axios.post(
          "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
          {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: finalAmount,
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: "HamsLoungePOS",
            TransactionDesc: "POS Product Checkout"
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            httpsAgent: mpesaAgent
          }
        );
        console.log(`📱 M-Pesa STK Push pushed safely to ${formattedPhone}`);
      } catch (stkError) {
        await t.rollback();
        console.error("🔥 M-Pesa STK Gateway Fail:", stkError.response ? stkError.response.data : stkError.message);
        return res.status(500).json({ error: "Safaricom M-Pesa API Handshake failure. Could not request PIN." });
      }
    }

    const rawResult = await sequelize.query(
      "INSERT INTO sales (total_amount, payment_method, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())",
      { replacements: [total_amount, payment_method], type: QueryTypes.INSERT, transaction: t }
    );

    const saleId = Array.isArray(rawResult) ? rawResult[0] : rawResult;

    for (const item of items) {
      await sequelize.query(
        "INSERT INTO saleitems (sale_id, item_name, quantity, price, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
        { replacements: [saleId, item.name, item.quantity, item.price], transaction: t }
      );

      await sequelize.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        { replacements: [item.quantity, item.id], transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: "Sale processed! Stock updated automatically.",
      saleId: saleId
    });
  } catch (err) {
    await t.rollback();
    console.error("🔥 Transaction Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [totalSales] = await sequelize.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales");
    const [countRow] = await sequelize.query("SELECT COUNT(*) AS total_tx FROM sales");

    res.json({
      revenue: parseFloat(totalSales[0].total),
      transactions: parseInt(countRow[0].total_tx || 0),
      topItems: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const [salesRows] = await sequelize.query("SELECT * FROM sales ORDER BY id DESC");

    const analyticalHistory = await Promise.all(salesRows.map(async (sale) => {
      const [items] = await sequelize.query(
        "SELECT item_name, quantity FROM saleitems WHERE sale_id = ?",
        { replacements: [sale.id] }
      );

      const itemsListString = items.map(i => `${i.item_name} x ${i.quantity}`).join(', ');
      const salesDateValue = sale.createdAt || sale.sale_date || sale.timestamp || new Date().toISOString();

      return {
        id: sale.id,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method,
        createdAt: salesDateValue,
        items_list: itemsListString || "Generic Lounge Order"
      };
    }));

    res.json(analyticalHistory);
  } catch (err) {
    console.error("🔥 Sales History Error:", err.message);
    res.status(500).json({ error: "Failed to parse sales history records.", details: err.message });
  }
};