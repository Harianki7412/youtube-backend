import asyncHandler from "express-async-handler"; // Simplifies async error handling
import jwt from "jsonwebtoken"; // For creating and verifying JWTs
import User from "../models/User.js"; // User Mongoose model
import Channel from "../models/Channel.js"; // Channel Mongoose model (to check user's channel)

// Helper function to generate a JWT token for a given user ID.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//  POST /api/auth/signup
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400);
    throw new Error("User with this email or username already exists");
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
      channelId: user.channels.length > 0 ? user.channels[0] : null,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data provided");
  }
});

// POST /api/auth/login
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).populate("channels", "_id");
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
      channelId: user.channels.length > 0 ? user.channels[0]._id : null,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// GET /api/auth/profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("channels", "channelName _id");

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      channels: user.channels,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export { registerUser, authUser, getUserProfile };