const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { auth } = require('../middleware/auth');

const makeToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const strip = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role,
  companyName: u.companyName, companyType: u.companyType,
  businessName: u.businessName, businessType: u.businessType,
  phone: u.phone, city: u.city
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role,
            companyName, companyType, gstin, productCategories,
            businessName, businessType, phone, city } = req.body;

    // Validate required
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password and role are required' });

    if (!['vendor','retailer'].includes(role))
      return res.status(400).json({ message: 'Role must be vendor or retailer' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Check duplicate
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'Email already registered. Please login.' });

    // Create — password auto-hashed by pre-save hook
    const user = await User.create({
      name, email, password, role,
      companyName, companyType, gstin,
      productCategories: productCategories || [],
      businessName,
      businessType: businessType || 'other',
      phone, city
    });

    res.status(201).json({ token: makeToken(user), user: strip(user) });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Email already registered' });
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ message: 'Email, password and role are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'No account found with this email' });

    if (user.role !== role)
      return res.status(401).json({ message: `This email is registered as a ${user.role}. Use ${user.role} login.` });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Wrong password' });

    res.json({ token: makeToken(user), user: strip(user) });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// ME
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(strip(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
