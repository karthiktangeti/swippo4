const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Order } = require('../models/CartOrder');
const Product = require('../models/Product');
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');

const MAX_MESSAGE_LENGTH = 500;
const LOW_STOCK_THRESHOLD = 10;
const money = value => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const dateRange = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = offset === 0 ? now : new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
  return { createdAt: { $gte: start, $lt: end } };
};
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const statusLabel = value => (value || '').replace(/_/g, ' ');
const formatOrder = order => {
  const items = (order.items || []).map(item =>
    `${item.name} × ${item.quantity} (${money(item.price * item.quantity)})`).join(', ');
  return `${order.orderId}: ${items || 'No item details'} — ${statusLabel(order.status)} — ${money(order.totalAmount)}`;
};

function detectIntent(message) {
  const text = message.toLowerCase();
  if (/(recommend|what should i buy|suggest)/.test(text)) return 'RECOMMEND_PRODUCTS';
  if (/(low stock|running low)/.test(text)) return 'GET_LOW_STOCK';
  if (/(out of stock|sold out)/.test(text)) return 'GET_OUT_OF_STOCK';
  if (/(best.sell|selling the most|top product)/.test(text)) return 'GET_BEST_SELLING_PRODUCTS';
  if (/(revenue|sales summary|sales statistics|how much.*(made|generated)|sales this month)/.test(text)) return 'GET_VENDOR_SALES';
  if (/(spend|spent|spending|cost me)/.test(text)) return 'GET_SPENDING';
  if (/(summary|overview|how many orders)/.test(text) && /(order|purchase)/.test(text)) return 'GET_ORDER_SUMMARY';
  if (/(track|where is|status of).*(ord[- ]?\w+)/.test(text)) return 'TRACK_ORDER';
  if (/(pending|processing).*(order|purchase)/.test(text)) return 'GET_PENDING_ORDERS';
  if (/(delivered).*(order|purchase)/.test(text)) return 'GET_DELIVERED_ORDERS';
  if (/(recent|history|my orders|orders)/.test(text)) return 'GET_RECENT_ORDERS';
  if (/(find|show|search|below|under|available|products?|rice|oil|flour|category|vendor)/.test(text)) return 'SEARCH_PRODUCTS';
  if (/(user|vendor|retailer|platform|overall|today).*(count|orders|revenue|statistics)/.test(text)) return 'GET_PLATFORM_STATS';
  return 'GENERAL_HELP';
}

function extractOrderId(message) {
  const match = message.match(/\bORD[-\s]?[A-Z0-9]+\b/i);
  return match ? match[0].replace(/\s/g, '-').toUpperCase() : null;
}

async function findOwnedOrder(orderId, user) {
  const order = await Order.findOne({ orderId: new RegExp(`^${escapeRegex(orderId)}$`, 'i') });
  if (!order) return { order: null, forbidden: false };
  if (user.role === 'retailer' && order.retailer.toString() !== user.id)
    return { order: null, forbidden: true };
  if (user.role === 'vendor' && !order.items.some(item => item.vendorId?.toString() === user.id))
    return { order: null, forbidden: true };
  return { order, forbidden: false };
}

async function handleMessage(message, user) {
  const intent = detectIntent(message);
  if (intent === 'GENERAL_HELP') return {
    intent, response: 'I can help with orders, products, inventory, sales and recommendations. Try asking “Show my recent orders”.'
  };

  if (intent === 'SEARCH_PRODUCTS') {
    const text = message.toLowerCase();
    const reserved = new Set(['find', 'show', 'search', 'products', 'product', 'with', 'stock', 'available', 'below', 'under', 'from', 'the', 'category', 'in', '₹']);
    const term = text.replace(/₹?\s*\d[\d,]*/g, '').match(/[a-z]{3,}/g)?.find(word => !reserved.has(word));
    const priceMatch = text.match(/(?:below|under|less than)\s*₹?\s*([\d,]+)/);
    const query = { active: true, inStock: true };
    if (term) query.$or = [{ name: { $regex: escapeRegex(term), $options: 'i' } }, { category: { $regex: escapeRegex(term), $options: 'i' } }, { companyName: { $regex: escapeRegex(term), $options: 'i' } }];
    if (priceMatch) query.price = { $lte: Number(priceMatch[1].replace(/,/g, '')) };
    const products = await Product.find(query).populate('vendor', 'name companyName').sort({ createdAt: -1 }).limit(10);
    if (!products.length) return { intent, response: 'I could not find any matching products currently in stock.', products: [] };
    return { intent, response: `I found ${products.length} product${products.length === 1 ? '' : 's'}:`, products: products.map(p => ({
      id: p._id, name: p.name, price: p.price, stock: p.stock, category: p.category,
      vendor: p.companyName || p.vendorName || p.vendor?.companyName || p.vendor?.name || 'Vendor', emoji: p.emoji
    })) };
  }

  if (user.role === 'retailer') {
    const ownQuery = { retailer: user.id };
    if (intent === 'TRACK_ORDER') {
      const orderId = extractOrderId(message);
      if (!orderId) return { intent, response: 'Please include an order ID, for example ORD1024.' };
      const result = await findOwnedOrder(orderId, user);
      if (result.forbidden) return { intent, response: 'You do not have permission to view that order.' };
      if (!result.order) return { intent, response: `I couldn't find an order with ID ${orderId}.` };
      const o = result.order;
      return { intent, response: `📦 ${o.orderId}\n${formatOrder(o)}\nExpected delivery: ${o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleDateString('en-IN') : 'Not available'}`, orders: [o] };
    }
    if (intent === 'GET_PENDING_ORDERS' || intent === 'GET_DELIVERED_ORDERS' || intent === 'GET_RECENT_ORDERS') {
      if (intent === 'GET_PENDING_ORDERS') ownQuery.status = { $in: ['placed', 'confirmed', 'processing'] };
      if (intent === 'GET_DELIVERED_ORDERS') ownQuery.status = 'delivered';
      const orders = await Order.find(ownQuery).sort({ createdAt: -1 }).limit(10);
      return { intent, response: orders.length ? orders.map(formatOrder).join('\n') : 'You do not have any matching orders yet.', orders };
    }
    if (intent === 'GET_ORDER_SUMMARY' || intent === 'GET_SPENDING') {
      const range = /last month|previous month/.test(message.toLowerCase()) ? dateRange(1) : dateRange(0);
      const orders = await Order.find({ ...ownQuery, ...(intent === 'GET_SPENDING' ? range : {}) });
      const totals = orders.reduce((acc, o) => { acc.total += o.totalAmount; acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, { total: 0 });
      if (intent === 'GET_SPENDING') return { intent, response: `💰 Your spending for the selected month is ${money(totals.total)} across ${orders.length} order${orders.length === 1 ? '' : 's'}.`, orders };
      return { intent, response: `📊 Order Summary\nTotal orders: ${orders.length}\nDelivered: ${totals.delivered || 0}\nProcessing: ${(totals.processing || 0) + (totals.placed || 0) + (totals.confirmed || 0)}\nShipped: ${(totals.shipped || 0) + (totals.out_for_delivery || 0)}\nCancelled: ${totals.cancelled || 0}\nTotal spent: ${money(totals.total)}`, orders };
    }
    if (intent === 'RECOMMEND_PRODUCTS') {
      const history = await Order.find(ownQuery).select('items.product').limit(50);
      const ids = [...new Set(history.flatMap(o => o.items.map(i => i.product?.toString()).filter(Boolean)))];
      if (!ids.length) return { intent, response: 'I need some purchase history before I can make recommendations.' };
      const purchased = await Product.find({ _id: { $in: ids } }).select('category');
      const categories = [...new Set(purchased.map(p => p.category))];
      const products = await Product.find({ active: true, inStock: true, category: { $in: categories }, _id: { $nin: ids } }).limit(8);
      return { intent, response: products.length ? 'Based on your previous purchases, you may like:' : 'I could not find additional in-stock products in your usual categories.', products };
    }
  }

  if (user.role === 'vendor') {
    if (intent === 'GET_LOW_STOCK' || intent === 'GET_OUT_OF_STOCK') {
      const query = { vendor: user.id, active: true, ...(intent === 'GET_LOW_STOCK' ? { stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } } : { $or: [{ stock: 0 }, { inStock: false }] }) };
      const products = await Product.find(query).sort({ stock: 1 });
      return { intent, response: products.length ? products.map(p => `${p.name}: ${p.stock} units`).join('\n') : 'No matching inventory items found.', products };
    }
    if (intent === 'GET_VENDOR_SALES' || intent === 'GET_BEST_SELLING_PRODUCTS') {
      const orders = await Order.find({ 'items.vendorId': user.id });
      const stats = {};
      let revenue = 0, units = 0;
      orders.forEach(o => o.items.filter(i => i.vendorId?.toString() === user.id).forEach(i => {
        stats[i.name] = (stats[i.name] || 0) + i.quantity; units += i.quantity; revenue += i.price * i.quantity;
      }));
      const best = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return { intent, response: intent === 'GET_BEST_SELLING_PRODUCTS'
        ? (best.length ? best.map(([name, count], i) => `${i + 1}. ${name} — ${count} units`).join('\n') : 'You do not have any sales yet.')
        : `📊 Sales Summary\nOrders received: ${orders.length}\nProducts sold: ${units} units\nRevenue: ${money(revenue)}`, orders };
    }
    if (intent === 'GET_RECENT_ORDERS') {
      const orders = await Order.find({ 'items.vendorId': user.id }).sort({ createdAt: -1 }).limit(10);
      return { intent, response: orders.length ? orders.map(o => `${o.orderId}: ${o.items.filter(i => i.vendorId?.toString() === user.id).map(i => `${i.name} × ${i.quantity}`).join(', ')} — ${statusLabel(o.status)}`).join('\n') : 'You have not received any orders yet.', orders };
    }
  }

  if (user.role === 'admin' && intent === 'GET_PLATFORM_STATS') {
    const [users, vendors, retailers, orders] = await Promise.all([
      User.countDocuments(), User.countDocuments({ role: 'vendor' }), User.countDocuments({ role: 'retailer' }), Order.find({})
    ]);
    return { intent, response: `📈 Platform Statistics\nUsers: ${users}\nVendors: ${vendors}\nRetailers: ${retailers}\nOrders: ${orders.length}\nPlatform revenue: ${money(orders.reduce((sum, o) => sum + o.totalAmount, 0))}` };
  }
  return { intent, response: 'That request is not available for your role. I can help with the orders, products, sales and inventory available to you.' };
}

router.post('/message', auth, async (req, res) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ message: `Message is required and must be under ${MAX_MESSAGE_LENGTH} characters` });
    const result = await handleMessage(message, req.user);
    await ChatHistory.create([
      { userId: req.user.id, role: req.user.role, message, sender: 'user' },
      { userId: req.user.id, role: req.user.role, message: result.response, sender: 'assistant' }
    ]);
    res.json(result);
  } catch (err) {
    console.error('CHATBOT ERROR:', err);
    res.status(500).json({ message: 'The assistant is temporarily unavailable. Please try again.' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(50).lean();
    res.json(history.reverse());
  } catch (err) {
    console.error('CHATBOT HISTORY ERROR:', err);
    res.status(500).json({ message: 'Unable to load chat history.' });
  }
});

router.delete('/history', auth, async (req, res) => {
  try {
    await ChatHistory.deleteMany({ userId: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    console.error('CHATBOT CLEAR ERROR:', err);
    res.status(500).json({ message: 'Unable to clear chat history.' });
  }
});

module.exports = router;
