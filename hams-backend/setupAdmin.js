const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// 1. SELF-CONTAINED CONNECTION (Bypassing the config folder entirely)
const sequelize = new Sequelize('hams_lounge', 'root', '1937Roy', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false 
});

async function seed() {
  try {
    console.log("Connecting directly to Hams Lounge MySQL Database...");
    
    // Test the database line immediately
    await sequelize.authenticate();
    console.log("📦 Connected to MySQL successfully!");

    // 2. BUILD TABLE IF MISSING
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'waiter',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // Clean up past entries to ensure fresh state
    await sequelize.query("DELETE FROM Users WHERE username = 'admin'");

    // 3. ENCRYPT NEW PASSWORD
    const securePassword = await bcrypt.hash('viceroy@2026', 10);

    // 4. PLANT THE ADMIN
    await sequelize.query(
      "INSERT INTO Users (username, password, role, createdAt, updatedAt) VALUES ('admin', ?, 'admin', NOW(), NOW())",
      { replacements: [securePassword] }
    );

    console.log("\n---------------------------------------");
    console.log("✅ SUCCESS: Hams Lounge Admin Account Created!");
    console.log("Username: admin");
    console.log("Password: viceroy@2026");
    console.log("---------------------------------------");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ CRITICAL DATABASE ERROR:", err.message);
    console.log("Please make sure your MySQL service is running and your password is correct.");
    process.exit(1);
  }
}

seed();