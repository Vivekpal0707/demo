const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
   if (!authHeader || !authHeader.startsWith("bearer ")) {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};