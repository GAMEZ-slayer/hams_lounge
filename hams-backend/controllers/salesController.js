const pool = require('../config/db');

exports.processCheckout = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { items, total_amount, payment_method, phone_number } = req.body;

    // Create items list string for display
    const itemsListString = items.map(item => `${item.name} x ${item.quantity}`).join(', ');

    // Create sale record
    const saleResult = await client.query(
      `INSERT INTO sales (total_amount, payment_method, phone_number, items_list)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [total_amount, payment_method, phone_number, itemsListString]
    );
    const saleId = saleResult.rows[0].id;

    // Add sale items and update product stock
    for (const item of items) {
      // Insert sale item
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, item_name, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.id, item.name, item.quantity, item.price]
      );

      // Update product stock
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Sale processed! Stock updated automatically.",
      saleId: saleId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("🔥 Transaction Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getStats = async (req, res) => {
  try {
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales`
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM sales`
    );

    res.json({
      revenue: parseFloat(revenueResult.rows[0].total),
      transactions: parseInt(countResult.rows[0].total || 0),
      topItems: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const salesResult = await pool.query(
      `SELECT * FROM sales ORDER BY created_at DESC`
    );

    const analyticalHistory = await Promise.all(
      salesResult.rows.map(async (sale) => {
        const itemsResult = await pool.query(
          `SELECT item_name, quantity FROM sale_items WHERE sale_id = $1`,
          [sale.id]
        );

        const itemsListString = itemsResult.rows
          .map(i => `${i.item_name} x ${i.quantity}`)
          .join(', ');

        return {
          id: sale.id,
          total_amount: sale.total_amount,
          payment_method: sale.payment_method,
          createdAt: sale.created_at,
          items_list: itemsListString || "Generic Lounge Order"
        };
      })
    );

    res.json(analyticalHistory);
  } catch (err) {
    console.error("🔥 Sales History Error:", err.message);
    res.status(500).json({ error: "Failed to parse sales history records.", details: err.message });
  }
};