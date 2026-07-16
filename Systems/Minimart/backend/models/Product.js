const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  sku: { type: String, unique: true },
  price: Number,
  quantity: Number,
  category: String,
});

// Auto-generate SKU before saving a new product
productSchema.pre('save', async function (next) {
  if (this.sku) return next(); // already has one (e.g. existing doc)
  const count = await mongoose.model('Product').countDocuments();
  this.sku = 'SKU-' + String(count + 1).padStart(5, '0');
  next();
});

module.exports = mongoose.model('Product', productSchema);
