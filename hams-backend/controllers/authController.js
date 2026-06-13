const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize'); 

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

exports.login = async (req, res) => {
  try {
    const { username, role, password, pin, name } = req.body;

    console.log(`\n--- 📥 INCOMING AUTHENTICATION ATTEMPT ---`);
    console.log(`Payload Data -> Role: "${role}", Username/Name Input: "${username}"`);

    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const providedPassword = password || pin || req.body.password || req.body.pin;
    const cleanInputPassword = String(providedPassword).trim();

    // ==========================================
    // 1. STAFF DYNAMIC LOGIN FLOW (ALLOW ANY NAME)
    // ==========================================
    if (role === 'staff') {
      console.log(`🔐 Processing Staff: Verifying PIN against universal "1234"...`);

      // Match the PIN directly
      if (cleanInputPassword !== '1234') {
        console.log(`❌ Staff Login Failure: PIN "${cleanInputPassword}" is incorrect.`);
        return res.status(401).json({ message: 'Incorrect password.' });
      }

      console.log(`✅ Staff Login Success: PIN matched for "${username}". Bypassing database lookup.`);

      // Generate a valid JWT token instantly using a mock ID since they aren't in the database
      if (!JWT_SECRET) {
        console.error('⚠️ Critical Configuration Failure: JWT_SECRET is missing.');
        return res.status(500).json({ message: 'Server configuration error.' });
      }

      const token = jwt.sign(
        { id: 9999, role: 'staff' }, // Static fallback ID for dynamic staff sessions
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return the exact name they typed directly back to the React app
      console.log(`🚀 Staff Session Active. Current context: [Name: "${username}"]`);
      return res.json({ token, role: 'staff', username: username });
    }

    // ==========================================
    // 2. ADMIN STANDARD DATABASE LOGIN FLOW
    // ==========================================
    console.log(`🛡️ Processing Admin: Fetching database records for "${username}"...`);

    const userRows = await sequelize.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      { 
        replacements: [username],
        type: QueryTypes.SELECT
      }
    );

    if (!userRows || userRows.length === 0) {
      console.log(`❌ Admin Login Failure: Account "${username}" does not exist.`);
      return res.status(401).json({ message: 'User not found.' });
    }

    const user = userRows[0];

    // Verify role match
    if (role && user.role !== role) {
      console.log(`❌ Admin Login Failure: Found user, but role is "${user.role}" instead of "${role}".`);
      return res.status(403).json({
        message: `Access Denied: This account is not registered as ${role.toUpperCase()}.`
      });
    }

    // Verify bcrypt hashed password for the admin
    const isMatch = await bcrypt.compare(cleanInputPassword, user.password);
    if (!isMatch) {
      console.log(`❌ Admin Login Failure: Incorrect password hash evaluated for "${username}".`);
      return res.status(401).json({ message: 'Incorrect password.' });
    }
    
    console.log(`✅ Admin Authenticated Successfully!`);

    if (!JWT_SECRET) {
      console.error('⚠️ Critical Configuration Failure: JWT_SECRET is missing.');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const adminToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token: adminToken, role: user.role, username: user.username });

  } catch (err) {
    console.error('🔴 Critical Exception Encountered During Login Evaluation:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};