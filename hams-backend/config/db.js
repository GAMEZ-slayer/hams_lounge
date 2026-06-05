const { Sequelize, QueryTypes } = require('sequelize');
const https = require('https');
const crypto = require('crypto');

// 1. Direct Database Connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false
});

// 2. TLS/SSL Agent Configuration
const mpesaAgent = new https.Agent({
  secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1,
  keepAlive: true
});

module.exports = {
  sequelize,
  QueryTypes,
  mpesaAgent
};