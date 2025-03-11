const Poll = require("../models/Poll");
const { v4: uuidv4 } = require("uuid");

const pollController = {
  createPoll: async (req, res) => {
    try {
      const { question, pollType, options, expiresIn, hideResults, isPrivate } =
        req.body;

      // Validate inputs
      if (!question || !pollType || !expiresIn) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Format options based on poll type
      let formattedOptions = [];
      if (pollType === "yes-no") {
        formattedOptions = [{ text: "Yes" }, { text: "No" }];
      } else if (pollType === "multiple-choice") {
        if (!Array.isArray(options) || options.length < 2) {
          return res.status(400).json({
            success: false,
            message: "Multiple choice polls require at least 2 options",
          });
        }
        formattedOptions = options.map((option) => ({ text: option }));
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid poll type",
        });
      }

      // Create poll with expiration
      const poll = new Poll({
        pollId: uuidv4(), // Generate a guaranteed unique UUID
        question,
        pollType,
        options: formattedOptions,
        expiresAt: new Date(Date.now() + expiresIn * 60 * 60 * 1000), // Convert hours to milliseconds
        hideResults: hideResults || false,
        isPrivate: isPrivate || false,
      });

      const savedPoll = await poll.save();

      res.status(201).json({
        success: true,
        message: "Poll created successfully",
        data: {
          pollId: savedPoll.pollId,
          expiresAt: savedPoll.expiresAt,
        },
      });
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create poll",
        error: error.message,
      });
    }
  },

  getPoll: async (req, res) => {
    try {
      const { id } = req.params;
      const poll = await Poll.findOne({ pollId: id });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: "Poll not found or has expired",
        });
      }

      // Check if poll has expired but not marked as expired
      if (poll.expiresAt < new Date() && !poll.isExpired) {
        await poll.markExpired();
      }

      // Prepare response
      const response = {
        success: true,
        data: {
          _id: poll._id,
          question: poll.question,
          pollType: poll.pollType,
          expiresAt: poll.expiresAt,
          hideResults: poll.hideResults,
          isPrivate: poll.isPrivate,
          createdAt: poll.createdAt,
          hasExpired: poll.expiresAt < new Date(),
          reactions: poll.reactions,
          comments: poll.comments,
        },
      };

      // Only show vote counts if poll doesn't hide results or has expired
      if (!poll.hideResults || poll.expiresAt < new Date()) {
        response.data.options = poll.options;
      } else {
        response.data.options = poll.options.map((option) => ({
          _id: option._id,
          text: option.text,
        }));
      }

      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching poll:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch poll",
        error: error.message,
      });
    }
  },

  submitVote: async (req, res) => {
    try {
      const { id } = req.params;
      const { optionId } = req.body;

      if (!optionId) {
        return res.status(400).json({
          success: false,
          message: "Option ID is required",
        });
      }

      const poll = await Poll.findOne({ pollId: id });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: "Poll not found or has expired",
        });
      }

      if (poll.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Poll has expired and voting is closed",
        });
      }

      // Find and increment the vote for the selected option
      const optionIndex = poll.options.findIndex(
        (option) => option._id.toString() === optionId
      );

      if (optionIndex === -1) {
        return res.status(400).json({
          success: false,
          message: "Invalid option selected",
        });
      }

      poll.options[optionIndex].votes += 1;
      await poll.save();

      // Return appropriate response based on hideResults setting
      const response = {
        success: true,
        message: "Vote submitted successfully",
      };

      if (!poll.hideResults) {
        response.data = {
          options: poll.options,
        };
      }

      res.status(200).json(response);
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit vote",
        error: error.message,
      });
    }
  },

  addReaction: async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;

      if (!["trending", "like"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reaction type",
        });
      }

      const poll = await Poll.findOne({ pollId: id });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: "Poll not found or has expired",
        });
      }

      // Increment the reaction count
      poll.reactions[type] += 1;
      await poll.save();

      res.status(200).json({
        success: true,
        message: "Reaction added successfully",
        data: {
          reactions: poll.reactions,
        },
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add reaction",
        error: error.message,
      });
    }
  },

  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment text is required",
        });
      }

      const poll = await Poll.findOne({ pollId: id });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: "Poll not found or has expired",
        });
      }

      if (poll.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Poll has expired and commenting is closed",
        });
      }

      const newComment = { text };
      poll.comments.push(newComment);
      await poll.save();

      res.status(200).json({
        success: true,
        message: "Comment added successfully",
        data: {
          comment: poll.comments[poll.comments.length - 1],
        },
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add comment",
        error: error.message,
      });
    }
  },

  getPublicPolls: async (req, res) => {
    try {
      // Get active public polls sorted by most recent
      const polls = await Poll.find({
        isPrivate: false,
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .limit(10);

      // Format response to include only necessary info
      const formattedPolls = polls.map((poll) => ({
        _id: poll._id,
        question: poll.question,
        pollType: poll.pollType,
        expiresAt: poll.expiresAt,
        reactions: poll.reactions,
        optionCount: poll.options.length,
        commentCount: poll.comments.length,
      }));

      res.status(200).json({
        success: true,
        data: {
          polls: formattedPolls,
        },
      });
    } catch (error) {
      console.error("Error fetching public polls:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch public polls",
        error: error.message,
      });
    }
  },

  getExpiredPoll: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the poll even if it's expired
      const poll = await Poll.findOne({ pollId: id });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: "Poll not found",
        });
      }

      if (poll.expiresAt > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Poll has not expired yet",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          _id: poll._id,
          question: poll.question,
          pollType: poll.pollType,
          options: poll.options,
          expiresAt: poll.expiresAt,
          reactions: poll.reactions,
          comments: poll.comments,
          createdAt: poll.createdAt,
        },
      });
    } catch (error) {
      console.error("Error fetching expired poll:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch expired poll",
        error: error.message,
      });
    }
  },
};

module.exports = pollController;
