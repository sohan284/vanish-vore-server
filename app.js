// app.js - Main server file
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import configurations and utilities
const connectDB = require("./config/db");
const initCronJobs = require("./utils/cronJobs");

// Import services
const services = require("./services");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: [
    "https://vanishvote-project.vercel.app",
    "http://localhost:3000",
    "http://localhost:3002",
  ], // Add your frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Enable credentials (cookies, authorization headers, etc)
  optionsSuccessStatus: 200,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Connect to database
connectDB();

// Add a test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Initialize services
services(app);

// Initialize cron jobs
initCronJobs();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
