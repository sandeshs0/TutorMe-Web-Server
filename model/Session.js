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
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "canceled"],
      default: "scheduled",
    },
    fee: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    tutorEarnings: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Session", SessionSchema);
