const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('hams_lounge', 'root', '1937Roy', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false 
});

async function run() {
  try {
    console.log("Connecting to insert sample inventory...");
    await sequelize.authenticate();

    // 1. Create the Products table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        stock INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // 2. Clear old test products to prevent duplicate errors
    await sequelize.query("DELETE FROM Products");

    // 3. Insert fresh sample bar stock
    const sampleItems = [
      ['Viceroy Brandy 750ml', 1500, 12, 'Brandy'],
      ['Tusker Lager Cider', 250, 48, 'Beer'],
      ['Guinness Stout', 280, 24, 'Beer'],
      ['Coca-Cola 300ml', 70, 60, 'Soft Drink'],
      ['White Cap Lager', 240, 36, 'Beer'],
      ['Jameson Irish Whiskey', 2800, 6, 'Whiskey']
    ];

    for (let item of sampleItems) {
      await sequelize.query(
        "INSERT INTO Products (name, price, stock, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
        { replacements: item }
      );
    }

    console.log("✅ SUCCESS: Drink items have been added to your database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database Error:", err.message);
    process.exit(1);
  }
}

run();