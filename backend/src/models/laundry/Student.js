'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const LaundryStudentSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, unique: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    middlename: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    birthdate: { type: Date, required: true },
  },
  { timestamps: true, collection: 'students' },
);

let _model = null;
async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('laundrypro');
  _model = conn.models['LaundryStudent'] || conn.model('LaundryStudent', LaundryStudentSchema);
  return _model;
}
module.exports = { getModel };
