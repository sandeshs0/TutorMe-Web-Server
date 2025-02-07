const express = require("express");
const Notification = require("../models/Notification");
const authenticateToken = require("../security/Auth");

const router = express.Router();

// Fetch notifications for a logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20); // Limit recent notifications

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark notifications as read
router.put("/mark-read", authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { isRead: true });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

module.exports = router;
