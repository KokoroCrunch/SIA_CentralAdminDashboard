const mongoose = require('mongoose');

// Water refilling products: e.g. "Slim 350mL", "Round 5-gallon refill", "Mineral Water 1L"
const productSchema = new mongoose.Schema(
  {
    _id: { type: Number, required: true },
    product_name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    // Container type: helps categorize the product
    container_type: {
      type: String,
      enum: ['Slim', 'Round', 'Mineral', 'Purified', 'Alkaline', 'Other'],
      default: 'Purified',
    },
    // Volume in liters
    volume_liters: { type: Number, default: 0 },
    price: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'products', versionKey: false },
);

module.exports = mongoose.model('Product', productSchema);
