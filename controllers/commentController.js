import asyncHandler from "express-async-handler";
import Video from "../models/Video.js";
import User from "../models/User.js";

//  POST /api/comments/:videoId

const addCommentToVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    res.status(400);
    throw new Error("Comment text cannot be empty");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const newComment = {
    userId: req.user._id,
    username: user.username,
    text,
    timestamp: new Date(),
  };

  video.comments.push(newComment);
  await video.save();

  const addedComment = video.comments[video.comments.length - 1];
  res.status(201).json(addedComment);
});

// @route   GET /api/comments/:videoId
const getCommentsForVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId)
    .select("comments")
    .populate("comments.userId", "username avatar");

  if (video) {
    res.json(video.comments.reverse());
  } else {
    res.status(404);
    throw new Error("Video not found");
  }
});

//  PUT /api/comments/:commentId
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    res.status(400);
    throw new Error("Comment text cannot be empty");
  }

  const video = await Video.findOne({ "comments._id": commentId });

  if (!video) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const comment = video.comments.id(commentId);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  if (comment.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this comment");
  }

  comment.text = text;
  comment.timestamp = new Date();

  await video.save();

  res.json({
    message: "Comment updated successfully",
    updatedComment: comment,
  });
});

//  DELETE /api/comments/:commentId
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const video = await Video.findOne({ "comments._id": commentId });

  if (!video) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const comment = video.comments.id(commentId);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  if (comment.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this comment");
  }

  comment.deleteOne();

  await video.save();

  res.json({ message: "Comment deleted successfully" });
});

export { addCommentToVideo, getCommentsForVideo, updateComment, deleteComment };
