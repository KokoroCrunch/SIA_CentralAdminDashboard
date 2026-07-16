const router = require('express').Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');

router.get('/', auth, async (req, res) => {
  try {
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
    res.status(500).json({ message: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const s = await Student.create(req.body);
    res.status(201).json(s);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Student ID already exists' });
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const s = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(s);
  } catch (e) {
    if (e.code === 11000)
      return res.status(400).json({ message: 'Student ID already used by another student' });
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
