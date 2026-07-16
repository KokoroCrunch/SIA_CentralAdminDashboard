const mongoose = require('mongoose');

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

// Calculate total price before saving
reservationSchema.pre('save', async function () {
  if (this.isModified('checkInDate') || this.isModified('checkOutDate')) {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.room);
    if (room) {
      const msPerMonth = 1000 * 60 * 60 * 24 * 30;
      const months = (this.checkOutDate - this.checkInDate) / msPerMonth;
      this.totalPrice = Math.ceil(months * room.pricePerMonth);
    }
  }
});

module.exports = mongoose.model('Reservation', reservationSchema);
