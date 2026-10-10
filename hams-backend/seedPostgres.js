require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool, Client } = require('pg');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
};

const targetDatabase = process.env.PGDATABASE || 'hams_lounge';

const setupAndSeedDatabase = async () => {
  console.log('🔄 Checking PostgreSQL connection and database...');

  // 1. Connect to default maintenance database 'postgres' to check/create target database
  const defaultClient = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await defaultClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    const dbCheck = await defaultClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDatabase]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`📦 Database "${targetDatabase}" does not exist. Creating it now...`);
      await defaultClient.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✅ Database "${targetDatabase}" created successfully!`);
    } else {
      console.log(`ℹ️ Database "${targetDatabase}" already exists.`);
    }
  } catch (err) {
    console.warn(`⚠️ Note on initial DB check: ${err.message}`);
  } finally {
    try {
      await defaultClient.end();
    } catch (e) {}
  }

  // 2. Connect to the target database
  const pool = new Pool({
    ...dbConfig,
    database: targetDatabase,
  });

  const client = await pool.connect();
  try {
    console.log(`🌱 Connecting to "${targetDatabase}" to setup schema and seed data...`);

    // 3. Execute schema.sql to ensure all tables exist
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Schema tables, indexes, and triggers verified/created.');

    // 4. Clear old test data
    await client.query('TRUNCATE products, sales, sale_items, users RESTART IDENTITY CASCADE');
    console.log('🗑️  Cleaned previous records.');

    // 5. Insert sample drinks
    const products = [
      ['Viceroy Brandy 750ml', 1500, 12, 'Brandy'],
      ['Tusker Lager Cider', 250, 48, 'Beer'],
      ['Guinness Stout', 280, 24, 'Beer'],
      ['Coca-Cola 300ml', 70, 60, 'Soft Drink'],
      ['White Cap Lager', 240, 36, 'Beer'],
      ['Jameson Irish Whiskey', 2800, 6, 'Whiskey'],
    ];

    for (const [name, price, stock, category] of products) {
      await client.query(
        'INSERT INTO products (name, price, stock, category) VALUES ($1, $2, $3, $4)',
        [name, price, stock, category]
      );
    }
    console.log(`✅ Inserted ${products.length} products.`);

    // 6. Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      ['admin', adminPassword, 'admin']
    );
    console.log('✅ Admin user ready: username "admin", password "admin123"');

    // 7. Create staff account
    const staffPin = await bcrypt.hash('1234', 10);
    await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      ['staff', staffPin, 'staff']
    );
    console.log('✅ Staff login ready: any name, PIN "1234"');

    // 8. Output all products
    const result = await client.query('SELECT * FROM products ORDER BY id');
    console.log('\n📦 Current Drink Inventory in PostgreSQL:');
    result.rows.forEach(p => {
      console.log(`   #${p.id} ${p.name} | Category: ${p.category} | Price: KSh ${p.price} | Stock: ${p.stock}`);
    });

    console.log('\n🎉 PostgreSQL database initialization and seed complete!');

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

setupAndSeedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
