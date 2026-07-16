const express = require('express');
const router = express.Router();
const { createAdmin, getAdmins } = require('../controllers/adminController');

router.post('/', createAdmin);
router.get('/', getAdmins);

module.exports = router;
