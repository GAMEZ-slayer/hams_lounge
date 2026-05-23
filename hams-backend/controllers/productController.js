const { sequelize } = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await sequelize.query("SELECT * FROM products");
    res.json(products);
  } catch (err) {
    try {
      const [capitalProducts] = await sequelize.query("SELECT * FROM Products");
      res.json(capitalProducts);
    } catch (dbError) {
      console.error("🔥 ACTUAL SQL ERROR:", dbError.message);
      res.status(500).json({ error: "Database table read failure.", details: dbError.message });
    }
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;
    try {
      await sequelize.query(
        "INSERT INTO Products (name, price, stock, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
        { replacements: [name, price, stock, category] }
      );
    } catch (err) {
      await sequelize.query(
        "INSERT INTO products (name, price, stock, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
        { replacements: [name, price, stock, category] }
      );
    }
    res.status(201).json({ success: true, message: "Product added successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    try {
      await sequelize.query(
        "UPDATE Products SET name = ?, price = ?, stock = ?, category = ?, updatedAt = NOW() WHERE id = ?",
        { replacements: [name, price, stock, category, id] }
      );
    } catch (err) {
      await sequelize.query(
        "UPDATE products SET name = ?, price = ?, stock = ?, category = ?, updatedAt = NOW() WHERE id = ?",
        { replacements: [name, price, stock, category, id] }
      );
    }
    res.json({ success: true, message: "Product record modified!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await sequelize.query("DELETE FROM Products WHERE id = ?", { replacements: [id] });
    } catch (err) {
      await sequelize.query("DELETE FROM products WHERE id = ?", { replacements: [id] });
    }
    res.json({ success: true, message: "Product purged successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};