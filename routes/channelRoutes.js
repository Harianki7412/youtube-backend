import express from "express";
import {
  createChannel,
  getChannelById,
  updateChannel,
  deleteChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
  getChannelVideos,
} from "../controllers/channelController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerMiddleware.js";
import asyncHandler from "express-async-handler";

const  router = express.Router();

// Public routes
router.get("/:id", getChannelById);
router.get("/:id/videos", getChannelVideos);

router.post(
  "/",
  protect,
  upload.fields([
    { name: "channelBanner", maxCount: 1 },
    { name: "channelAvatar", maxCount: 1 },
  ]),
  asyncHandler(createChannel)
);
router.put("/:id", protect, updateChannel);
router.delete("/:id", protect, deleteChannel);
router.put("/:id/subscribe", protect, subscribeToChannel);
router.put("/:id/unsubscribe", protect, unsubscribeFromChannel);

export default router;
