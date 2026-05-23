const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import our connection

// This defines the "Products" table in MySQL
const Product = sequelize.define('Product', {
  // 1. The name of the drink (e.g., "Tusker")
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // 2. The price (e.g., 250.00)
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  // 3. Current stock (e.g., 24)
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // 4. Category (e.g., "Beers", "Spirits")
  category: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Product;