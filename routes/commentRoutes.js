import express from "express";
import {
  addCommentToVideo,
  getCommentsForVideo,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:videoId", getCommentsForVideo);
router.post("/:videoId", protect, addCommentToVideo);
router
  .route("/:commentId")
  .put(protect, updateComment)
  .delete(protect, deleteComment);

export default router;
