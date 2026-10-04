const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const schema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:          { type: String, required: true },
  role:              { type: String, enum: ['vendor','retailer','admin'], required: true },
  // vendor fields
  companyName:       { type: String, trim: true },
  companyType:       { type: String, trim: true },
  gstin:             { type: String, trim: true },
  productCategories: [String],
  // retailer fields
  businessName:      { type: String, trim: true },
  businessType:      { type: String, enum: ['kirana','restaurant','hotel','cafe','supermarket','other'], default: 'other' },
  // shared
  phone:   { type: String },
  city:    { type: String, trim: true },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
schema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare entered password with stored hash
schema.methods.comparePassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', schema);
