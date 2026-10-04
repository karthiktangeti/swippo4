const express = require('express');
const router  = express.Router();
const { Cart, Order } = require('../models/CartOrder');
const { auth, retailerOnly, vendorOnly } = require('../middleware/auth');

// ── RETAILER: Place order ──────────────────────────────────────────────────
router.post('/place', auth, retailerOnly, async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod = 'digital' } = req.body;
    if (!deliveryAddress) return res.status(400).json({ message: 'Delivery address required' });

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart?.items?.length) return res.status(400).json({ message: 'Cart is empty' });

    const totalAmount = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

    const order = await Order.create({
      retailer: req.user.id,
      items: cart.items.map(i => ({
        product:    i.product._id,
        name:       i.product.name,
        quantity:   i.quantity,
        price:      i.price,
        emoji:      i.product.emoji,
        vendorName: i.product.companyName || i.product.vendorName,
        vendorId:   i.product.vendor   // ✅ KEY FIX — save vendor reference
      })),
      totalAmount,
      paymentMethod,
      deliveryAddress,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
      timeline: [{ status: 'placed', message: 'Order placed successfully', time: new Date() }]
    });

    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
    res.status(201).json(order);
  } catch (e) {
    console.error('Place order error:', e);
    res.status(500).json({ message: e.message });
  }
});

// ── VENDOR: All orders for their products ──────────────────────────────────
router.get('/vendor-orders', auth, vendorOnly, async (req, res) => {
  try {
    const orders = await Order.find({ 'items.vendorId': req.user.id })
      .populate('retailer', 'name businessName businessType city phone email')
      .sort({ createdAt: -1 });

    // Return only this vendor's items in each order
    const result = orders.map(order => {
      const myItems = order.items.filter(
        i => i.vendorId && i.vendorId.toString() === req.user.id
      );
      return {
        _id:             order._id,
        orderId:         order.orderId,
        status:          order.status,
        paymentMethod:   order.paymentMethod,
        paymentStatus:   order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        createdAt:       order.createdAt,
        retailer:        order.retailer,
        myItems,
        myTotal: myItems.reduce((s, i) => s + i.price * i.quantity, 0)
      };
    });

    res.json(result);
  } catch (e) {
    console.error('Vendor orders error:', e);
    res.status(500).json({ message: e.message });
  }
});

// ── VENDOR: Update order status ────────────────────────────────────────────
router.patch('/vendor-orders/:id/status', auth, vendorOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed','processing','shipped','out_for_delivery','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    const isMyOrder = order.items.some(
      i => i.vendorId && i.vendorId.toString() === req.user.id
    );
    if (!isMyOrder) return res.status(403).json({ message: 'Not your order' });

    order.status = status;
    const msgs = {
      confirmed:'Vendor confirmed the order', processing:'Vendor is packing items',
      shipped:'Dispatched via logistics', out_for_delivery:'Out for delivery',
      delivered:'Order delivered', cancelled:'Order cancelled by vendor'
    };
    if (!order.timeline.find(t => t.status === status)) {
      order.timeline.push({ status, message: msgs[status], time: new Date() });
    }
    await order.save();
    res.json({ ok: true, status: order.status });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── RETAILER: My orders list ───────────────────────────────────────────────
router.get('/', auth, retailerOnly, async (req, res) => {
  try {
    res.json(await Order.find({ retailer: req.user.id }).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── RETAILER: Single order detail (with auto-progress) ────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.retailer.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const mins = (Date.now() - new Date(order.createdAt)) / 60000;
    const push = (s, m) => {
      if (!order.timeline.find(t => t.status === s))
        order.timeline.push({ status: s, message: m, time: new Date() });
    };
    if (mins > 2  && order.status === 'placed')         { order.status = 'confirmed';        push('confirmed','Vendor confirmed your order'); }
    if (mins > 5  && order.status === 'confirmed')      { order.status = 'processing';       push('processing','Packing your items'); }
    if (mins > 12 && order.status === 'processing')     { order.status = 'shipped';          push('shipped','Dispatched via logistics'); }
    if (mins > 20 && order.status === 'shipped')        { order.status = 'out_for_delivery'; push('out_for_delivery','Out for delivery'); }
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
