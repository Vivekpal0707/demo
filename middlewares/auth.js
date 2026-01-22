const jwt = require('jsonwebtoken');
const { UserModel } = require('../models/userModel'); 
const JWT_SECRET = process.env.JWT_SECRET;

exports.auth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  const token = authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await UserModel.findOne({
      where: {
        id: decoded.id,
        deletedAt: null 
      }
    });

   if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();

  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
