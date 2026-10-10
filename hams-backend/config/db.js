const { Pool, types } = require('pg');

// Parse PostgreSQL NUMERIC/DECIMAL as JavaScript float numbers
types.setTypeParser(types.builtins.NUMERIC, (val) => parseFloat(val));

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL Connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
});

module.exports = pool;
