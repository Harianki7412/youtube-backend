import asyncHandler from "express-async-handler";
import Channel from "../models/Channel.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
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

// POST /api/channels

const createChannel = asyncHandler(async (req, res) => {
  const { channelName, description } = req.body;
  const ownerId = req.user._id;

  if (!channelName) {
    res.status(400);
    throw new Error("Channel name is required.");
  }

  const existingChannel = await Channel.findOne({ owner: ownerId });
  if (existingChannel) {
    res.status(400);
    throw new Error("You already own a channel.");
  }

  if (
    !req.files ||
    !req.files.channelBanner ||
    req.files.channelBanner.length === 0 ||
    !req.files.channelAvatar ||
    req.files.channelAvatar.length === 0
  ) {
    res.status(400);
    throw new Error("Channel banner and avatar files are required.");
  }

  const channelBannerBuffer = req.files.channelBanner[0].buffer;
  const channelAvatarBuffer = req.files.channelAvatar[0].buffer;

  let bannerResult, avatarResult;

  try {
    bannerResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "youtube-clone/channel_banners" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary banner upload error:", error);
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(channelBannerBuffer);
    });

    avatarResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "youtube-clone/channel_avatars" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary avatar upload error:", error);
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(channelAvatarBuffer);
    });
  } catch (uploadError) {
    console.error(
      "Overall Cloudinary upload process failed for channel images:",
      uploadError
    );
    res.status(500);
    throw new Error(
      `Image upload failed: ${uploadError.message || "Unknown error"}`
    );
  }

  const channel = await Channel.create({
    channelName,
    owner: ownerId,
    description,
    profilePicture: avatarResult.secure_url, 
    profilePicturePublicId: avatarResult.public_id, 
    channelBanner: bannerResult.secure_url, 
    channelBannerPublicId: bannerResult.public_id, 
  });

  const user = await User.findById(ownerId);
  if (user) {
    user.channelId = channel._id;
    await user.save();
  } else {
    console.warn(`User with ID ${ownerId} not found after channel creation.`);
  }

  res.status(201).json(channel);
});

//  GET /api/channels/:id
const getChannelById = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.id)
    .populate("owner", "username profilePicture")
    .populate("subscribers", "username profilePicture")
    .populate("videos", "title thumbnailUrl views createdAt");

  if (!channel) {
    res.status(404);
    throw new Error("Channel not found");
  }
  res.json(channel);
});

//  PUT /api/channels/:id
const updateChannel = asyncHandler(async (req, res) => {
  const { channelName, description } = req.body;

  const channel = await Channel.findById(req.params.id);

  if (channel) {
    if (channel.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error("Not authorized to update this channel");
    }

    channel.channelName = channelName || channel.channelName;
    channel.description = description || channel.description;

    const updatedChannel = await channel.save();
    res.json(updatedChannel);
  } else {
    res.status(404);
    throw new Error("Channel not found");
  }
});

// @route   DELETE /api/channels/:id
const deleteChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.id);

  if (channel) {
    if (channel.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error("Not authorized to delete this channel");
    }

    try {
      if (channel.channelBannerPublicId) {
        await cloudinary.uploader.destroy(channel.channelBannerPublicId, {
          resource_type: "image",
        });
        console.log(
          `Deleted channel banner from Cloudinary: ${channel.channelBannerPublicId}`
        );
      }
      if (channel.profilePicturePublicId) {
        await cloudinary.uploader.destroy(channel.profilePicturePublicId, {
          resource_type: "image",
        });
        console.log(
          `Deleted channel avatar from Cloudinary: ${channel.profilePicturePublicId}`
        );
      }
    } catch (cloudinaryErr) {
      console.error(
        "Error deleting channel images from Cloudinary:",
        cloudinaryErr
      );
    }

    const ownerUser = await User.findById(channel.owner);
    if (ownerUser) {
      ownerUser.channelId = undefined;
      await ownerUser.save();
    }

    await channel.deleteOne();
    res.json({ message: "Channel removed successfully" });
  } else {
    res.status(404);
    throw new Error("Channel not found");
  }
});

//    PUT /api/channels/:id/subscribe
const subscribeToChannel = asyncHandler(async (req, res) => {
  const channelId = req.params.id;
  const userId = req.user._id;

  const channel = await Channel.findById(channelId);
  const user = await User.findById(userId);

  if (!channel) {
    res.status(404);
    throw new Error("Channel not found");
  }
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (channel.owner.toString() === userId.toString()) {
    res.status(400);
    throw new Error("Cannot subscribe to your own channel");
  }

  if (!channel.subscribers.includes(userId)) {
    channel.subscribers.push(userId);
    await channel.save();
  }

  if (!user.subscriptions.includes(channelId)) {
    user.subscriptions.push(channelId);
    await user.save();
  }

  res.json({
    message: "Subscribed successfully",
    subscribers: channel.subscribers.length,
  });
});

// PUT /api/channels/:id/unsubscribe
const unsubscribeFromChannel = asyncHandler(async (req, res) => {
  const channelId = req.params.id;
  const userId = req.user._id;

  const channel = await Channel.findById(channelId);
  const user = await User.findById(userId);

  if (!channel) {
    res.status(404);
    throw new Error("Channel not found");
  }
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  channel.subscribers = channel.subscribers.filter(
    (subscriberId) => subscriberId.toString() !== userId.toString()
  );
  await channel.save();

  user.subscriptions = user.subscriptions.filter(
    (subChannelId) => subChannelId.toString() !== channelId.toString()
  );
  await user.save();

  res.json({
    message: "Unsubscribed successfully",
    subscribers: channel.subscribers.length,
  });
});

// GET /api/channels/:id/videos

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.params.id;
  const videos = await Video.find({ channel: channelId })
    .populate("uploader", "username profilePicture")
    .sort({ createdAt: -1 });

  if (!videos) {
    res.status(404);
    throw new Error("No videos found for this channel");
  }
  res.json(videos);
});

export {
  createChannel,
  getChannelById,
  updateChannel,
  deleteChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
  getChannelVideos,
};
