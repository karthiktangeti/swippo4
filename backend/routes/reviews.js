const express = require('express');
const router = express.Router();
const { Order } = require('../models/CartOrder');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { auth, retailerOnly, vendorOnly } = require('../middleware/auth');

router.use(auth);

router.get('/order/:orderId', async (req, res) => {
  try {
    if (req.user.role !== 'retailer') return res.status(403).json({ message: 'Retailers only' });
    const reviews = await Review.find({ retailer: req.user.id, order: req.params.orderId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/vendor', vendorOnly, async (req, res) => {
  try {
    const reviews = await Review.find({ vendor: req.user.id })
      .populate('retailer', 'name businessName')
      .populate('product', 'name emoji')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', retailerOnly, async (req, res) => {
  try {
    const { orderId, productId, rating, comment = '' } = req.body;
    const numericRating = Number(rating);
    if (!orderId || !productId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Order, product and a rating from 1 to 5 are required' });
    }

    const order = await Order.findOne({ _id: orderId, retailer: req.user.id, status: 'delivered' });
    if (!order) return res.status(400).json({ message: 'Reviews are available after delivery' });
    const item = order.items.find(entry => entry.product?.toString() === productId);
    if (!item) return res.status(400).json({ message: 'Product was not part of this order' });

    const product = await Product.findById(productId).select('vendor');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = await Review.create({
      retailer: req.user.id,
      vendor: product.vendor,
      product: product._id,
      order: order._id,
      rating: numericRating,
      comment: String(comment).trim()
    });

    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$product', rating: { $avg: '$rating' }, reviews: { $sum: 1 } } }
    ]);
    await Product.findByIdAndUpdate(product._id, {
      rating: Math.round((stats[0].rating + Number.EPSILON) * 10) / 10,
      reviews: stats[0].reviews
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reviewed this product for this order' });
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
