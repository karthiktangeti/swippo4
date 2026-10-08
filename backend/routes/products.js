const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const { auth, vendorOnly } = require('../middleware/auth');

// Browse all (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page=1, limit=20 } = req.query;
    const q = { inStock: true, active: true, stock: { $gt: 0 } };
    if (category && category !== 'all') q.category = category;
    if (search) q.name = { $regex: search, $options: 'i' };
    const s = sort === 'price_asc' ? { price:1 } : sort === 'price_desc' ? { price:-1 } : sort === 'rating' ? { rating:-1 } : { createdAt:-1 };
    const total    = await Product.countDocuments(q);
    const products = await Product.find(q).populate('vendor','name companyName city').sort(s).skip((page-1)*limit).limit(+limit);
    res.json({ products, total, page:+page });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Vendor's own products
router.get('/my', auth, vendorOnly, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const products = await Product.find({ vendor: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Single product
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('vendor','name companyName city');
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add product (vendor)
router.post('/', auth, vendorOnly, async (req, res) => {
  try {
    const { name, description, price, mrp, unit, minOrder, stock, category, emoji } = req.body;
    if (!name || !price || !category) return res.status(400).json({ message: 'Name, price and category required' });
    const User = require('../models/User');
    const vendor = await User.findById(req.user.id);
    const p = await Product.create({
      vendor: req.user.id, vendorName: vendor.name, companyName: vendor.companyName,
      name, description, price:+price, mrp:mrp?+mrp:undefined,
      unit:unit||'unit', minOrder:+minOrder||1, stock:+stock||100, category, emoji:emoji||'📦'
    });
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Edit product (vendor)
router.put('/:id', auth, vendorOnly, async (req, res) => {
  try {
    const p = await Product.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!p) return res.status(404).json({ message: 'Not found or not yours' });
    const wasPrice = p.price;
    const wasAvailable = p.inStock && p.stock > 0;
    ['name','description','price','mrp','unit','minOrder','stock','category','emoji','inStock','active'].forEach(f => {
      if (req.body[f] !== undefined) p[f] = req.body[f];
    });
    if (req.body.stock !== undefined && req.body.inStock === undefined) {
      p.inStock = Number(req.body.stock) > 0;
    }
    await p.save();
    const isAvailable = p.inStock && p.stock > 0;
    const watchers = await Wishlist.find({ product: p._id }).select('user');
    const notifications = [];
    for (const watcher of watchers) {
      if (p.price < wasPrice) {
        notifications.push({
          user: watcher.user, product: p._id, type: 'price_drop',
          title: 'Price drop alert',
          message: `${p.name} is now ₹${p.price.toLocaleString()} (was ₹${wasPrice.toLocaleString()}).`
        });
      }
      if (!wasAvailable && isAvailable) {
        notifications.push({
          user: watcher.user, product: p._id, type: 'back_in_stock',
          title: 'Back in stock',
          message: `${p.name} is available again.`
        });
      }
    }
    if (notifications.length) await Notification.insertMany(notifications);
    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete product (vendor)
router.delete('/:id', auth, vendorOnly, async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
