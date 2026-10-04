const express = require('express');
const router  = express.Router();
const { Cart } = require('../models/CartOrder');
const Product  = require('../models/Product');
const { auth, retailerOnly } = require('../middleware/auth');

const total = items => items.reduce((s,i) => s + i.price*i.quantity, 0);

router.get('/', auth, retailerOnly, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) return res.json({ items:[], total:0 });
    res.json({ items: cart.items, total: total(cart.items) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/add', auth, retailerOnly, async (req, res) => {
  try {
    const { productId, quantity=1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    let cart = await Cart.findOne({ user: req.user.id }) || new Cart({ user: req.user.id, items: [] });
    const idx = cart.items.findIndex(i => i.product.toString() === productId);
    if (idx >= 0) cart.items[idx].quantity += +quantity;
    else cart.items.push({ product: productId, quantity: +quantity, price: product.price });
    await cart.save();
    await cart.populate('items.product');
    res.json({ items: cart.items, total: total(cart.items) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/update', auth, retailerOnly, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    if (+quantity <= 0) cart.items = cart.items.filter(i => i.product.toString() !== productId);
    else { const it = cart.items.find(i => i.product.toString() === productId); if (it) it.quantity = +quantity; }
    await cart.save();
    await cart.populate('items.product');
    res.json({ items: cart.items, total: total(cart.items) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/remove/:pid', auth, retailerOnly, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) { cart.items = cart.items.filter(i => i.product.toString() !== req.params.pid); await cart.save(); await cart.populate('items.product'); }
    res.json({ items: cart?.items||[], total: total(cart?.items||[]) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/clear', auth, retailerOnly, async (req, res) => {
  try { await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] }); res.json({ items:[], total:0 }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
