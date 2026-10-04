const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const vendorOnly = (req, res, next) => {
  if (req.user?.role !== 'vendor') return res.status(403).json({ message: 'Vendors only' });
  next();
};

const retailerOnly = (req, res, next) => {
  if (req.user?.role !== 'retailer') return res.status(403).json({ message: 'Retailers only' });
  next();
};

module.exports = { auth, vendorOnly, retailerOnly };
