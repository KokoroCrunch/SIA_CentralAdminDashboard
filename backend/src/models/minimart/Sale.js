'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const saleSchema = new mongoose.Schema(
  {
    items: [],
    total: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'sales' },
);

let _model = null;

async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('minimart');
  _model = conn.models['MinimartSale'] || conn.model('MinimartSale', saleSchema);
  return _model;
}

module.exports = { getModel };
