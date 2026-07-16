'use strict';

const router = require('express').Router();
const { getModel: getStudentModel } = require('../../models/laundry/Student');
const auditLog = require('../../utils/auditLog');

// GET /api/v1/laundry/students
router.get('/', async (req, res) => {
  try {
    const Student = await getStudentModel();
    const { search, gender } = req.query;
    const filter = {};
    if (gender) filter.gender = gender;
    if (search)
      filter.$or = [
        { firstname: new RegExp(search, 'i') },
        { lastname: new RegExp(search, 'i') },
        { student_id: new RegExp(search, 'i') },
      ];
    const students = await Student.find(filter).sort({ lastname: 1, firstname: 1 });
    res.json(students);
  } catch (e) {
    console.error('[laundry/students GET]', e);
    res.status(500).json({ message: e.message });
  }
});

// POST /api/v1/laundry/students
router.post('/', async (req, res) => {
  try {
    const Student = await getStudentModel();
    const s = await Student.create(req.body);
    auditLog(req, {
      system: 'laundry',
      action: 'created',
      entity: 'Student',
      entityId: s._id,
      description: `Laundry student "${s.firstname} ${s.lastname}" (ID: ${s.student_id}) created`,
      meta: {
        student_id: s.student_id,
        firstname: s.firstname,
        lastname: s.lastname,
        gender: s.gender,
      },
    });
    res.status(201).json(s);
  } catch (e) {
    console.error('[laundry/students POST]', e);
    if (e.code === 11000) return res.status(400).json({ message: 'Student ID already exists' });
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/v1/laundry/students/:id
router.put('/:id', async (req, res) => {
  try {
    const Student = await getStudentModel();
    const s = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ message: 'Student not found' });
    auditLog(req, {
      system: 'laundry',
      action: 'updated',
      entity: 'Student',
      entityId: s._id,
      description: `Laundry student "${s.firstname} ${s.lastname}" (ID: ${s.student_id}) updated`,
      meta: req.body,
    });
    res.json(s);
  } catch (e) {
    console.error('[laundry/students PUT]', e);
    if (e.code === 11000)
      return res.status(400).json({ message: 'Student ID already used by another student' });
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/v1/laundry/students/:id
router.delete('/:id', async (req, res) => {
  try {
    const Student = await getStudentModel();
    const s = await Student.findByIdAndDelete(req.params.id);
    auditLog(req, {
      system: 'laundry',
      action: 'deleted',
      entity: 'Student',
      entityId: req.params.id,
      description: `Laundry student "${s ? `${s.firstname} ${s.lastname}` : req.params.id}" deleted`,
      meta: s ? { student_id: s.student_id, firstname: s.firstname, lastname: s.lastname } : {},
    });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[laundry/students DELETE]', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
