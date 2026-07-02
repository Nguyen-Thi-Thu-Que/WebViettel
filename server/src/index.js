const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const packageRoutes = require('./routes/packageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
if (!mongoUri) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing!");
  process.exit(1);
}

mongoose.connect(mongoUri, { dbName: 'goicuocviettel' })
  .then(() => {
    console.log("Successfully connected to MongoDB database: goicuocviettel");
  })
  .catch((err) => {
    console.error("Database connection failure:", err);
  });

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/packages', packageRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    name: "Viettel Mobile Package Management Backend API",
    status: "active",
    version: "1.0.0"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error logger:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Đã xảy ra lỗi máy chủ nội bộ."
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express API Server is running on port: ${PORT}`);
});
