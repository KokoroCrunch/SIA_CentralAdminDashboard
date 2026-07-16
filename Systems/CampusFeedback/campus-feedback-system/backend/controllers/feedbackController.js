const Feedback = require('../models/Feedback');

// Create Complaint
exports.createComplaint = async (req, res) => {
  try {
    const complaint = await Feedback.create({
      ...req.body,
      user_id: req.userId,
    });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Complaints (admins see all, users see only their own)
exports.getComplaints = async (req, res) => {
  try {
    let complaints;
    if (req.userRole === 'admin') {
      complaints = await Feedback.find().populate('user_id', 'name email');
    } else {
      complaints = await Feedback.find({ user_id: req.userId }).populate('user_id', 'name email');
    }
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update complaint action taken by admin
exports.updateComplaint = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update complaints' });
    }

    const complaint = await Feedback.findByIdAndUpdate(
      req.params.id,
      { action_taken: req.body.action_taken },
      { new: true },
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete complaint (admin only)
exports.deleteComplaint = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete complaints' });
    }

    const complaint = await Feedback.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ message: 'Complaint deleted successfully', complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
