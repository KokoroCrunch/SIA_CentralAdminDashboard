'use strict';

/**
 * Room Model — reads from the 'dormitory' database on AdminHub cluster.
 * Schema matches the original standalone Dormitory Reservation system exactly:
 *   roomNumber, type, floor, capacity, pricePerMonth, amenities, status, description, image
 */

const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['single', 'double', 'triple', 'quad'],
      required: [true, 'Room type is required'],
    },
    floor: {
      type: Number,
      required: [true, 'Floor is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
    },
    pricePerMonth: {
      type: Number,
      required: [true, 'Price is required'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

let _model = null;

async function getRoomModel() {
  if (_model) return _model;
  const conn = await getConnection('dormitory');
  _model = conn.models['Room'] || conn.model('Room', roomSchema);
  return _model;
}

module.exports = { getRoomModel };
