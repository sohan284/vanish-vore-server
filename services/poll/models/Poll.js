const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const pollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    unique: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  pollType: {
    type: String,
    enum: ["multiple-choice", "yes-no"],
    required: true,
  },
  options: [optionSchema],
  expiresAt: {
    type: Date,
    required: true,
  },
  hideResults: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  reactions: {
    trending: {
      type: Number,
      default: 0,
    },
    like: {
      type: Number,
      default: 0,
    },
  },
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
});

// Virtual field to check if poll has expired
pollSchema.virtual("hasExpired").get(function () {
  return new Date() > this.expiresAt;
});

// Middleware to filter out expired polls in regular queries
pollSchema.pre("find", function () {
  this.where({
    $or: [{ expiresAt: { $gt: new Date() } }, { isExpired: false }],
  });
});

pollSchema.pre("findOne", function () {
  this.where({
    $or: [{ expiresAt: { $gt: new Date() } }, { isExpired: false }],
  });
});

// Method to mark poll as expired
pollSchema.methods.markExpired = async function () {
  this.isExpired = true;
  return this.save();
};

const Poll = mongoose.model("Poll", pollSchema);

module.exports = Poll;
