const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { username, password, pin, role } = req.body;
    console.log("📥 Incoming Unified Login Attempt:", { username, password, pin, role });

    // === HARDCODED EMERGENCY BYPASS ===
    if ((username === 'admin' || role === 'admin') && (password === '123456' || password === 'admin')) {
      console.log("🔑 Master Admin Bypass Triggered!");
      const token = jwt.sign({ id: 1, role: 'admin' }, 'HAMS_SECRET_KEY_2026', { expiresIn: '12h' });
      return res.json({ token, role: 'admin', username: 'admin' });
    }

    const submittedPin = String(pin || password || '');
    if (role === 'staff' || username === 'staff' || submittedPin === '2026') {
      if (submittedPin === '2026' || submittedPin === '1234') {
        console.log("📱 Master Staff Bypass Triggered!");
        const token = jwt.sign({ id: 2, role: 'staff' }, 'HAMS_SECRET_KEY_2026', { expiresIn: '12h' });
        return res.json({ token, role: 'staff', username: 'staff' });
      }
    }
    // ===================================

    const [userRows] = await sequelize.query(
      "SELECT * FROM Users WHERE username = ? OR email = ? LIMIT 1", 
      { replacements: [username || '', username || ''] }
    );

    if (!userRows || userRows.length === 0) {
      return res.status(401).json({ message: 'User profile registry not found.' });
    }

    const databaseUser = userRows[0];

    if (role && databaseUser.role !== role) {
      return res.status(403).json({ 
        message: `Access Denied: This account is not registered as an ${role.toUpperCase()}.` 
      });
    }

    const authenticationPayload = databaseUser.role === 'staff' ? submittedPin : password;
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(authenticationPayload, databaseUser.password);
    } catch (e) {
      isMatch = false;
    }

    if (!isMatch && databaseUser.password === authenticationPayload) {
      isMatch = true; 
    }

    if (!isMatch) {
      return res.status(401).json({ message: `Invalid credentials for ${databaseUser.role || 'user'}.` });
    }
    
    const token = jwt.sign(
      { id: databaseUser.id, role: databaseUser.role }, 
      'HAMS_SECRET_KEY_2026', 
      { expiresIn: '12h' }
    );

    return res.json({ token, role: databaseUser.role, username: databaseUser.username });

  } catch (err) {
    console.error("🔥 Login Route Exception Error:", err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};