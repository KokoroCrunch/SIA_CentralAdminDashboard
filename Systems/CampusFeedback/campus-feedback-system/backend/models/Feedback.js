const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    complaint_type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    action_taken: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Feedback', feedbackSchema);
