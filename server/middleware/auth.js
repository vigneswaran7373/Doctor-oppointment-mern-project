const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
};

exports.allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Not allowed' });
