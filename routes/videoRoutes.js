import express from "express";
import {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  incrementVideoView,
  likeVideo,
  dislikeVideo,
} from "../controllers/videoController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerMiddleware.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/", getVideos);
router.get("/:id", getVideoById);

router.post(
  "/upload",
  protect,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  asyncHandler(uploadVideo)
);
router.put("/:id", protect, updateVideo);
router.delete("/:id", protect, deleteVideo);
router.put("/:id/view", incrementVideoView);
router.put("/:id/like", protect, likeVideo);
router.put("/:id/dislike", protect, dislikeVideo);

export default router;
