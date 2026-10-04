const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true, min: 1 },
    price:    { type: Number, required: true }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  retailer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId:         { type: String, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String, quantity: Number, price: Number,
    emoji: String, vendorName: String,
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  totalAmount:      { type: Number, required: true },
  paymentMethod:    { type: String, enum: ['digital','cash','credit'], default: 'digital' },
  paymentStatus:    { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  status:           { type: String, enum: ['placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'], default: 'placed' },
  deliveryAddress:  { type: String, required: true },
  estimatedDelivery: Date,
  timeline: [{ status: String, message: String, time: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now }
});

OrderSchema.pre('save', function(next) {
  if (!this.orderId) this.orderId = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100);
  if (!this.estimatedDelivery) {
    const d = new Date(); d.setHours(d.getHours() + 24);
    this.estimatedDelivery = d;
  }
  next();
});

module.exports = {
  Cart:  mongoose.model('Cart',  CartSchema),
  Order: mongoose.model('Order', OrderSchema)
};
