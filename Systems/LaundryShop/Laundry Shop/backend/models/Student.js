const mongoose = require('mongoose');
const StudentSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, unique: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    middlename: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    birthdate: { type: Date, required: true },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Student', StudentSchema);
