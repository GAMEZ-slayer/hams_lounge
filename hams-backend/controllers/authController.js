const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

exports.login = async (req, res) => {
  try {
    const { username, role } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const [userRows] = await sequelize.query(
      'SELECT * FROM Users WHERE username = ? LIMIT 1',
      { replacements: [username] }
    );

    if (!userRows || userRows.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }

    const user = userRows[0];

    // Still enforce role match — admin can't login as staff and vice versa
    if (role && user.role !== role) {
      return res.status(403).json({
        message: `Access Denied: This account is not registered as ${role.toUpperCase()}.`
      });
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