const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/rooms directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'rooms');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // room-<timestamp>.<ext>  e.g. room-1720000000000.jpg
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `room-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const isAllowed =
    allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
