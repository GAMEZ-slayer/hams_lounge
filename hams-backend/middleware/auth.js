const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. Grab the token from the request header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
  }

  try {
    // 2. Verify if the token is valid and hasn't expired
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'HAMS_SECRET_KEY_2026');
    req.user = verified; // Attach user data (id, role) to the request
    next(); // Move to the actual route handler
  } catch (err) {
    res.status(403).json({ message: 'Invalid or Expired Token!' });
  }
};