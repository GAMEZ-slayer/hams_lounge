const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Connect to your MySQL Database matching your server configuration
const sequelize = new Sequelize('hams_lounge', 'root', '1937Roy', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log // Shows SQL execution details in terminal
});

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to database and creating Users table if missing...');

    // 1. Create the Users table matching your raw SQL queries structure
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);
    console.log('✅ Users table is ready.');

    // 2. Prepare the login credentials hashes
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    const staffPinHash = await bcrypt.hash('2026', 10);

    // 3. Clear existing old default test users to avoid duplication crashes
    await sequelize.query("DELETE FROM Users WHERE username IN ('admin', 'staff')");

    // 4. Insert Admin user
    await sequelize.query(
      "INSERT INTO Users (username, password, role, createdAt, updatedAt) VALUES ('admin', ?, 'admin', NOW(), NOW())",
      { replacements: [adminPasswordHash] }
    );
    console.log('👤 Admin user inserted successfully! (User: admin / Pass: 123456)');

    // 5. Insert Staff user
    await sequelize.query(
      "INSERT INTO Users (username, password, role, createdAt, updatedAt) VALUES ('staff', ?, 'staff', NOW(), NOW())",
      { replacements: [staffPinHash] }
    );
    console.log('👥 Staff user inserted successfully! (User: staff / PIN: 2026)');

    console.log('\n🚀 Database seeding completed successfully! You can close this script now.');
    process.exit(0);

  } catch (error) {
    console.error('🔥 Error running setup seed script:', error);
    process.exit(1);
  }
}

initializeDatabase();