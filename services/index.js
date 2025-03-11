const pollService = require("./poll");

// Initialize all services
module.exports = function (app) {
  // Initialize poll service
  pollService(app);

  // Add other services here as your app grows
  // Example: userService(app);
};
