const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    roomId: {
      type: String,
      required: true, // Jitsi Meet Room ID
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String, // Stored in HH:mm format
      default: null, // Will be set when session ends
    },
    duration: {
      type: Number, // Estimated duration before the session starts
      default: 0, // Updated after the session ends
    },
    actualDuration: {
      type: Number, // Actual calculated duration after session
      default: 0,
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "canceled"],
      default: "scheduled",
    },
    hourlyRate: {
      type: Number,
      required: true, // Store tutor's hourly rate
    },
    totalFee: {
      type: Number,
      default: 0, // Will be calculated at the end of the session
    },
    platformFee: {
      type: Number,
      default: 0, // Will be calculated at the end of the session
    },
    tutorEarnings: {
      type: Number,
      default: 0, // Will be calculated at the end of the session
    },
    roomPassword:{
      type: String,
      default: null,
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Session", SessionSchema);
