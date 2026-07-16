const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  items: [],
  total: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Sale', saleSchema);
