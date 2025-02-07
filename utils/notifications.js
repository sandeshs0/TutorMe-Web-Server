const Notification = require("../models/Notification");

const sendNotification = async (userId, message, type = "booking") => {
  try {
    const notification = new Notification({ userId, message, type });
    await notification.save();
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = { sendNotification };
