const cron = require("node-cron");
const Poll = require("../services/poll/models/Poll");

// Function to mark expired polls
const markExpiredPolls = async () => {
  try {
    const result = await Poll.updateMany(
      { expiresAt: { $lt: new Date() }, isExpired: false },
      { $set: { isExpired: true } }
    );
    console.log(`Marked ${result.modifiedCount} polls as expired`);
  } catch (error) {
    console.error("Error marking expired polls:", error);
  }
};

// Initialize cron jobs
const initCronJobs = () => {
  // Schedule task to run every hour to mark expired polls
  cron.schedule("0 * * * *", () => {
    console.log("Running scheduled task: marking expired polls");
    markExpiredPolls();
  });

  // Run initial check on startup
  markExpiredPolls();
};

module.exports = initCronJobs;
