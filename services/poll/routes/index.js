const express = require("express");
const router = express.Router();
const pollController = require("../controllers/pollController");
const cors = require("cors");

// Add CORS configuration
router.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  })
);

// Create a new poll
router.post("/", pollController.createPoll);

// Get a specific poll by ID
router.get("/:id", pollController.getPoll);

// Submit a vote for a specific poll option
router.post("/:id/vote", pollController.submitVote);

// Add a reaction to a poll
router.post("/:id/reaction", pollController.addReaction);

// Add a comment to a poll
router.post("/:id/comment", pollController.addComment);

// Get public polls for browsing
router.get("/", pollController.getPublicPolls);

// Get expired poll results
router.get("/:id/expired", pollController.getExpiredPoll);

module.exports = router;
