const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
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
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "declined",
        "reschedule_requested",
        "rescheduled",
        "completed",
      ],
      default: "pending",
    },
    proposedDate: {
      type: Date,
    },
    proposedStartTime: {
      type: String,
    },
    bookingFee: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", BookingSchema);
