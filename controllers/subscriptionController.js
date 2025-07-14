import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Channel from "../models/Channel.js";

//  GET /api/subscriptions/:channelId/status

const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  const channel = await Channel.findById(channelId);
  if (!channel) {
    res.status(404);
    throw new Error("Channel not found");
  }

  const user = await User.findById(userId).select("+subscribedChannels");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isSubscribed = (user.subscribedChannels || []).includes(
    channelId.toString()
  );

  res.status(200).json({ isSubscribed });
});

//  POST /api/subscriptions/:channelId/subscribe
//  DELETE /api/subscriptions/:channelId/unsubscribe
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  const targetChannel = await Channel.findById(channelId);
  if (!targetChannel) {
    res.status(404);
    throw new Error("Channel not found.");
  }

  const currentUser = await User.findById(userId).select("+subscribedChannels");
  if (!currentUser) {
    res.status(404);
    throw new Error("User not found.");
  }

  if (!Array.isArray(currentUser.subscribedChannels)) {
    currentUser.subscribedChannels = [];
  }
  if (!Array.isArray(targetChannel.subscribers)) {
    targetChannel.subscribers = [];
  }

  const isSubscribed = currentUser.subscribedChannels.includes(
    channelId.toString()
  );

  if (isSubscribed) {
    currentUser.subscribedChannels = currentUser.subscribedChannels.filter(
      (id) => id.toString() !== channelId.toString()
    );
    targetChannel.subscribers = targetChannel.subscribers.filter(
      (id) => id.toString() !== userId.toString()
    );
    await currentUser.save();
    await targetChannel.save();
    res.status(200).json({
      message: "Unsubscribed successfully.",
      isSubscribed: false,
      subscriberCount: targetChannel.subscribers.length,
    });
  } else {
    currentUser.subscribedChannels.push(channelId);
    targetChannel.subscribers.push(userId);
    await currentUser.save();
    await targetChannel.save();
    res.status(200).json({
      message: "Subscribed successfully.",
      isSubscribed: true,
      subscriberCount: targetChannel.subscribers.length,
    });
  }
});

export { getSubscriptionStatus, toggleSubscription };
