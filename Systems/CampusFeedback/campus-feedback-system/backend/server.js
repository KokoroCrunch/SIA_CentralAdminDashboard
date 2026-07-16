const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/feedbackRoutes');

const app = express();

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// DB Connection
const dbName = process.env.DB_NAME || 'complaint-feedback-management-system';

mongoose
  .connect(process.env.MONGO_URI, { dbName })
  .then(() => console.log(`MongoDB Connected ✅ database=${dbName}`))
  .catch((err) => console.error('MongoDB Connection Error:', err));

app.listen(5000, () => console.log('Server running on port 5000'));
