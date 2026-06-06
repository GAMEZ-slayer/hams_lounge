const { sequelize } = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await sequelize.query("SELECT * FROM products");
    res.json(products);
  } catch (err) {
    console.error("🔥 ACTUAL SQL ERROR:", err.message);
    res.status(500).json({ error: "Database table read failure.", details: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;
    await sequelize.query(
      "INSERT INTO products (name, price, stock, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
      { replacements: [name, price, stock, category] }
    );
    res.status(201).json({ success: true, message: "Product added successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    await sequelize.query(
      "UPDATE products SET name = ?, price = ?, stock = ?, category = ?, updatedAt = NOW() WHERE id = ?",
      { replacements: [name, price, stock, category, id] }
    );
    res.json({ success: true, message: "Product record modified!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query("DELETE FROM products WHERE id = ?", { replacements: [id] });
    res.json({ success: true, message: "Product purged successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};