import express from "express";
import {
  getSubscriptionStatus,
  toggleSubscription,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:channelId/status", protect, getSubscriptionStatus);
router.post("/:channelId/subscribe", protect, toggleSubscription);
router.delete("/:channelId/unsubscribe", protect, toggleSubscription);

export default router;
