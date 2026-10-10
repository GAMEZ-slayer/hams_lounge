const pool = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 PostgreSQL Error:", err.message);
    res.status(500).json({ error: "Database read failure.", details: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, stock, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, stock, category]
    );
    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, stock = $3, category = $4 WHERE id = $5 RETURNING *',
      [name, price, stock, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product record modified!",
      product: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true, message: "Product purged successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
