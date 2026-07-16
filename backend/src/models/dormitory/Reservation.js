'use strict';

/**
 * Reservation Model — reads from the 'dormitory' database on AdminHub cluster.
 * Schema matches the original standalone Dormitory Reservation system exactly:
 *   user, room, checkInDate, checkOutDate, status, totalPrice, notes, adminNotes
 */

const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    totalPrice: {
      type: Number,
    },
    notes: {
      type: String,
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// User schema for the dormitory DB's own users collection
const dormUserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    studentId: { type: String },
    phone: { type: String },
    role: { type: String },
    password: { type: String, select: false },
  },
  { timestamps: true },
);

let _resModel = null;
let _userModel = null;

async function getReservationModel() {
  if (_resModel) return _resModel;
  const conn = await getConnection('dormitory');
  _resModel = conn.models['Reservation'] || conn.model('Reservation', reservationSchema);
  return _resModel;
}

async function getDormUserModel() {
  if (_userModel) return _userModel;
  const conn = await getConnection('dormitory');
  _userModel = conn.models['User'] || conn.model('User', dormUserSchema);
  return _userModel;
}

module.exports = { getReservationModel, getDormUserModel };
