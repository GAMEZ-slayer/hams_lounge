const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'hams_lounge_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

exports.changePassword = async (req, res) => {
  try {
    const { userId, targetUsername, newPassword, newCredential, role, targetRole } = req.body;

    const username = targetUsername || req.body.username;
    const passwordToSet = newCredential || newPassword;
    const userRole = targetRole || role;

    console.log(`🔒 Requesting credential change for: ${username || userId} (${userRole})`);

    if ((!userId && !username) || !passwordToSet) {
      return res.status(400).json({ error: "Missing required fields (username/userId, newPassword)." });
    }

    if (passwordToSet.length < 4) {
      return res.status(400).json({ error: "Password or PIN must be at least 4 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedCredential = await bcrypt.hash(passwordToSet, salt);

    if (userId) {
      await pool.query(
        "UPDATE users SET password = $1 WHERE id = $2",
        [hashedCredential, userId]
      );
    } else {
      const updateResult = await pool.query(
        "UPDATE users SET password = $1 WHERE username = $2",
        [hashedCredential, username]
      );

      // If user doesn't exist yet, insert them
      if (updateResult.rowCount === 0) {
        await pool.query(
          "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
          [username, hashedCredential, userRole || 'staff']
        );
      }
    }

    return res.json({ success: true, message: `Credentials updated successfully for ${username || 'user'}.` });

  } catch (err) {
    console.error("🔥 Error updating user password:", err.message);
    return res.status(500).json({ error: "Failed to update user credentials.", details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, role, password, pin, name } = req.body;

    console.log(`\n--- 📥 INCOMING AUTHENTICATION ATTEMPT ---`);
    console.log(`Payload Data -> Role: "${role}", Username/Name: "${username}"`);

    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const providedPassword = password || pin || req.body.password || req.body.pin;
    const cleanInputPassword = String(providedPassword).trim();

    // ==========================================
    // 1. STAFF DYNAMIC LOGIN FLOW
    // ==========================================
    if (role === 'staff') {
      console.log(`🔐 Processing Staff: Verifying PIN against universal "1234"...`);

      if (cleanInputPassword !== '1234') {
        console.log(`❌ Staff Login Failure: PIN "${cleanInputPassword}" is incorrect.`);
        return res.status(401).json({ message: 'Incorrect PIN.' });
      }

      console.log(`✅ Staff Login Success: PIN matched for "${username}".`);

      const token = jwt.sign(
        { id: 9999, role: 'staff' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({ token, role: 'staff', username: username });
    }

    // ==========================================
    // 2. ADMIN DATABASE LOGIN FLOW
    // ==========================================
    console.log(`🛡️ Processing Admin: Fetching database record for "${username}"...`);

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Admin Login Failure: Account "${username}" does not exist.`);
      return res.status(401).json({ message: 'User not found.' });
    }

    const user = result.rows[0];

    if (role && user.role !== role) {
      console.log(`❌ Admin Login Failure: Found user, but role is "${user.role}" instead of "${role}".`);
      return res.status(403).json({
        message: `Access Denied: This account is not registered as ${role.toUpperCase()}.`
      });
    }

    const isMatch = await bcrypt.compare(cleanInputPassword, user.password);
    if (!isMatch) {
      console.log(`❌ Admin Login Failure: Incorrect password hash for "${username}".`);
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    console.log(`✅ Admin Authenticated Successfully!`);

    const adminToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token: adminToken, role: user.role, username: user.username });

  } catch (err) {
    console.error('🔴 Critical Exception Encountered During Login Evaluation:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};
