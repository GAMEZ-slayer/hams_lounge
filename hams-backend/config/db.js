const { Sequelize, QueryTypes } = require('sequelize');
const https = require('https');
const crypto = require('crypto');

// 1. Direct Database Connection
const sequelize = new Sequelize('hams_lounge', 'root', '1937Roy', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false 
});

// 2. TLS/SSL Agent Configuration to resolve Safari Daraja Gateway connection drops (ECONNRESET)
const mpesaAgent = new https.Agent({
  secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1,
  keepAlive: true
});

module.exports = {
  sequelize,
  QueryTypes,
  mpesaAgent
};