const Notification = require("../model/Notification");


const sendRealTimeUpdate = (userId, event, data) => {
  if (!userId) {
    console.error("Invalid userId provided for WebSocket event.");
    return;
  }
  console.log("Inside Realitime notification ")

  const socketId = global.connectedUsers[userId.toString()];
  console.log("Checking connectedUsers:", global.connectedUsers);
  console.log(` Checking for user: ${userId}, Found socket ID:`, socketId);
  if (!global.io) {
    console.error(" io is undefined! WebSocket might not be initialized.");
    return;
  }

  if (socketId) {
    global.io.to(socketId).emit(event, data);
    console.log(` WebSocket Event Sent: ${event} to user ${userId}`);
  } else {
    console.warn(` User ${userId} is not online. Storing notification.`);
    // sendNotification(userId, `You have a new ${event}`);
  }
};

const sendNotification = async (userId, message, type = "booking") => {
  try {
    const notification = new Notification({ userId, message, type });
    await notification.save();
    sendRealTimeUpdate(userId, "new-notification", notification);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = { sendNotification };
