const pollRoutes = require("./routes/index");

module.exports = function (app) {
  // Mount poll routes under /api/polls
  app.use("/api/polls", pollRoutes);
};
