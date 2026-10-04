const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  vendor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorName:  String,
  companyName: String,
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true, min: 0 },
  mrp:         { type: Number },
  unit:        { type: String, default: 'unit' },
  minOrder:    { type: Number, default: 1 },
  stock:       { type: Number, default: 100 },
  category:    { type: String, enum: ['staples','dairy','produce','fmcg','beverages','snacks','cleaning','packaged'], required: true },
  emoji:       { type: String, default: '📦' },
  inStock:     { type: Boolean, default: true },
  active:      { type: Boolean, default: true },
  rating:      { type: Number, default: 4.2 },
  reviews:     { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', schema);
