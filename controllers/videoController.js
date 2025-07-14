import asyncHandler from "express-async-handler";
import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split("/");
  const publicIdWithExtension = parts[parts.length - 1];
  const publicId = publicIdWithExtension.split(".")[0];
  const folderPath = parts
    .slice(parts.indexOf("upload") + 2, parts.length - 1)
    .join("/");
  return folderPath ? `${folderPath}/${publicId}` : publicId;
};

//  POST /api/videos/upload
const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description, category, channel } = req.body;
  const uploader = req.user._id;

  if (!title || !channel || !uploader) {
    res.status(400);
    throw new Error("Video title, channel ID, and uploader ID are required.");
  }

  if (
    !req.files ||
    !req.files.videoFile ||
    req.files.videoFile.length === 0 ||
    !req.files.thumbnailFile ||
    req.files.thumbnailFile.length === 0
  ) {
    res.status(400);
    throw new Error("Video and thumbnail files are required.");
  }

  const videoBuffer = req.files.videoFile[0].buffer;
  const thumbnailBuffer = req.files.thumbnailFile[0].buffer;

  let videoResult, thumbnailResult;

  try {
    videoResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "video", folder: "youtube-clone/videos" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary video upload error:", error);
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(videoBuffer);
    });

    thumbnailResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "youtube-clone/thumbnails" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary thumbnail upload error:", error);
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(thumbnailBuffer);
    });
  } catch (uploadError) {
    console.error("Overall Cloudinary upload process failed:", uploadError);
    res.status(500);
    throw new Error(
      `Cloudinary upload failed: ${
        uploadError.message || "Unknown upload error"
      }`
    );
  }

  const video = await Video.create({
    title,
    description,
    videoUrl: videoResult.secure_url,
    videoPublicId: videoResult.public_id,
    thumbnailUrl: thumbnailResult.secure_url,
    thumbnailPublicId: thumbnailResult.public_id,
    category,
    channel,
    uploader,
    duration: Math.round(videoResult.duration),
  });

  const existingChannel = await Channel.findById(channel);
  if (existingChannel) {
    existingChannel.videos.push(video._id);
    await existingChannel.save();
  } else {
    console.warn(
      `Channel with ID ${channel} not found for video ${video._id}. Video created but not linked to channel.`
    );
  }

  res.status(201).json({
    message: "Video uploaded successfully.",
    video,
  });
});

//  GET /api/videos
const getVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({})
    .populate("channel", "channelName profilePicture")
    .populate("uploader", "username profilePicture")
    .sort({ createdAt: -1 });
  res.json(videos);
});

// GET /api/videos/:id

const getVideoById = asyncHandler(async (req, res) => {
  // Find video by ID and populate related channel, uploader, and comment user details
  const video = await Video.findById(req.params.id)
    .populate("channel", "channelName profilePicture")
    .populate("uploader", "username profilePicture")
    .populate("comments.userId", "username profilePicture"); // Populate user details for embedded comments

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  video.views = (video.views || 0) + 1;
  await video.save();

  res.json(video);
});

// PUT /api/videos/:id

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description, category, tags } = req.body;

  const video = await Video.findById(req.params.id);

  if (video) {
    if (video.uploader.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error("Not authorized to update this video");
    }

    video.title = title || video.title;
    video.description = description || video.description;
    video.category = category || video.category;
    video.tags = tags || video.tags;

    const updatedVideo = await video.save();
    res.json(updatedVideo);
  } else {
    res.status(404);
    throw new Error("Video not found");
  }
});

//  DELETE /api/videos/:id

const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (video) {
    if (video.uploader.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error("Not authorized to delete this video");
    }

    try {
      if (video.videoPublicId) {
        await cloudinary.uploader.destroy(video.videoPublicId, {
          resource_type: "video",
        });
        console.log(`Deleted video from Cloudinary: ${video.videoPublicId}`);
      }
      if (video.thumbnailPublicId) {
        await cloudinary.uploader.destroy(video.thumbnailPublicId, {
          resource_type: "image",
        });
        console.log(
          `Deleted thumbnail from Cloudinary: ${video.thumbnailPublicId}`
        );
      }
    } catch (cloudinaryErr) {
      console.error("Error deleting files from Cloudinary:", cloudinaryErr);
    }

    const associatedChannel = await Channel.findById(video.channel);
    if (associatedChannel) {
      associatedChannel.videos = associatedChannel.videos.filter(
        (videoId) => videoId.toString() !== video._id.toString()
      );
      await associatedChannel.save();
    }

    await video.deleteOne();
    res.json({ message: "Video removed successfully" });
  } else {
    res.status(404);
    throw new Error("Video not found");
  }
});

//   PUT /api/videos/:id/view
const incrementVideoView = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (video) {
    video.views = (video.views || 0) + 1;
    await video.save();
    res.json({ message: "View count incremented", views: video.views });
  } else {
    res.status(404);
    throw new Error("Video not found");
  }
});

// @route   PUT /api/videos/:id/like
const likeVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (video) {
    const userId = req.user._id;
    if (!video.likes) video.likes = [];
    if (!video.dislikes) video.dislikes = [];

    if (video.dislikes.includes(userId)) {
      video.dislikes = video.dislikes.filter(
        (id) => id.toString() !== userId.toString()
      );
    }

    if (video.likes.includes(userId)) {
      video.likes = video.likes.filter(
        (id) => id.toString() !== userId.toString()
      ); // Unlike
    } else {
      video.likes.push(userId);
    }

    await video.save();
    res.json({
      message: "Video liked/unliked",
      likes: video.likes.length,
      dislikes: video.dislikes.length,
    });
  } else {
    res.status(404);
    throw new Error("Video not found");
  }
});

// PUT /api/videos/:id/dislike
const dislikeVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (video) {
    const userId = req.user._id;
    if (!video.likes) video.likes = [];
    if (!video.dislikes) video.dislikes = [];

    if (video.likes.includes(userId)) {
      video.likes = video.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    }

    if (video.dislikes.includes(userId)) {
      video.dislikes = video.dislikes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      video.dislikes.push(userId);
    }

    await video.save();
    res.json({
      message: "Video disliked/undisliked",
      likes: video.likes.length,
      dislikes: video.dislikes.length,
    });
  } else {
    res.status(404);
    throw new Error("Video not found");
  }
});

export {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  incrementVideoView,
  likeVideo,
  dislikeVideo,
};
