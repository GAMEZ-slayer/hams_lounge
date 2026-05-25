const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

exports.login = async (req, res) => {
  try {
    const { username, password, pin, role } = req.body;

    if (!username || (!password && !pin)) {
      return res.status(400).json({ message: 'Username and password/pin are required.' });
    }

    const [userRows] = await sequelize.query(
      'SELECT * FROM Users WHERE username = ? LIMIT 1',
      { replacements: [username] }
    );

    // DEBUG — remove after confirming login works
    console.log('🔍 DB lookup for:', username, '| Found:', userRows.length, 'user(s)');
    if (userRows[0]) {
      console.log('👤 User:', userRows[0].username, '| Role:', userRows[0].role, '| Pass preview:', userRows[0].password?.substring(0, 10));
    }

    if (!userRows || userRows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = userRows[0];

    if (role && user.role !== role) {
      return res.status(403).json({
        message: `Access Denied: This account is not registered as ${role.toUpperCase()}.`
      });
    }

    const submittedCredential = user.role === 'staff'
      ? String(pin || password || '')
      : String(password || '');

    if (!submittedCredential) {
      return res.status(400).json({ message: 'Credential (password or PIN) is required.' });
    }

    const isMatch = await bcrypt.compare(submittedCredential, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables.');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token, role: user.role, username: user.username });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};