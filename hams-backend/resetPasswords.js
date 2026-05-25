const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');

async function resetPassword() {
  const newPassword = 'admin123'; // Change this to whatever you want

  const hash = await bcrypt.hash(newPassword, 10);

  await sequelize.query(
    'UPDATE Users SET password = ? WHERE username = ?',
    { replacements: [hash, 'admin'] }
  );

  console.log(`✅ Password for 'admin' has been reset to: ${newPassword}`);
  console.log(`🔒 New hash: ${hash}`);
  process.exit(0);
}

resetPassword().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});