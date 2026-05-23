const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sale = sequelize.define('Sale', {
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'M-Pesa', 'Card'),
    allowNull: false
  },
  itemsSold: {
    type: DataTypes.TEXT, // We will store the list of drinks as a string for now
    allowNull: false
  }
});

module.exports = Sale;