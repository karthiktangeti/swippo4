const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const { auth, retailerOnly } = require('../middleware/auth');

router.use(auth, retailerOnly);

router.get('/', async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user.id })
      .populate({ path: 'product', populate: { path: 'vendor', select: 'name companyName city' } })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:productId', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, active: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const item = await Wishlist.findOneAndUpdate(
      { user: req.user.id, product: product._id },
      { user: req.user.id, product: product._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate({ path: 'product', populate: { path: 'vendor', select: 'name companyName city' } });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already in wishlist' });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user.id, product: req.params.productId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
