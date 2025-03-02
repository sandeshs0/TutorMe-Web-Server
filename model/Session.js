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
      type: String, 
      default: null, // Will be set when session ends
    },
    duration: {
      type: Number, 
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
      required: true, 
    },
    totalFee: {
      type: Number,
      default: 0, 
    },
    platformFee: {
      type: Number,
      default: 0, 
    },
    tutorEarnings: {
      type: Number,
      default: 0, 
    },
    roomPassword:{
      type: String,
      default: null,
    }
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Session", SessionSchema);
