const mongoose = require('mongoose');

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

module.exports = mongoose.model('Room', roomSchema);
