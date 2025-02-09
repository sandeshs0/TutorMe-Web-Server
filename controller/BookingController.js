const Booking = require("../model/Booking");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const Transaction = require("../model/Transaction"); // Track transactions
const { sendNotification } = require("../utils/notifications"); // Notification utility

// const { io } = require("../app"); // Import io properly
// const connectedUsers = require("../socketStore");

// Booking Fee (To prevent fraudulent bookings)
const BOOKING_FEE = 30;
// Platform Commission (20%)
const PLATFORM_COMMISSION = 0.2;

/**
 * Send real-time updates using WebSockets
 */
const sendRealTimeUpdate = (userId, event, data) => {
  if (!userId) {
    console.error("Invalid userId provided for WebSocket event.");
    return;
  }

  const socketId = global.connectedUsers[userId.toString()];
  console.log("🔍 Checking connectedUsers:", global.connectedUsers);
  console.log(`🔍 Checking for user: ${userId}, Found socket ID:`, socketId);
  if (!global.io) {
    console.error("❌ io is undefined! WebSocket might not be initialized.");
    return;
  }

  if (socketId) {
    global.io.to(socketId).emit(event, data);
    console.log(`✅ WebSocket Event Sent: ${event} to user ${userId}`);
  } else {
    console.warn(`⚠️ User ${userId} is not online. Storing notification.`);
    sendNotification(userId, `You have a new ${event}`);
  }
};

const BookingController = {
  /**
   * Create a new booking request
   */
  async createBooking(req, res) {
    try {
      const { tutorId, date, time, note } = req.body;
      const student = await Student.findOne({ userId: req.user.id });

      if (!student) {
        return res.status(404).json({ message: "Student profile not found." });
      }

      // ✅ Fetch tutor & populate userId to ensure it's available
      const tutor = await Tutor.findById(tutorId).populate("userId", "id");

      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found." });
      }

      if (!tutor.userId) {
        console.error("❌ Tutor userId is missing for tutor:", tutor);
        return res.status(500).json({ message: "Tutor data is incomplete." });
      }

      console.log("✅ Tutor found:", tutor);

      // ✅ Check if student has enough balance
      if (student.walletBalance < tutor.hourlyRate + BOOKING_FEE) {
        return res
          .status(400)
          .json({ message: "Insufficient wallet balance." });
      }

      // ✅ Deduct booking fee from student's wallet
      student.walletBalance -= BOOKING_FEE;
      await student.save();

      // ✅ Create booking entry
      const booking = new Booking({
        studentId: student._id,
        tutorId,
        date,
        startTime: time,
        note,
        status: "pending",
      });

      await booking.save();
      console.log("✅ Booking created:", booking);
      console.log("✅ Tutor fetched:", tutor);

      if (!tutor || !tutor.userId) {
        console.log("❌ Tutor userId is missing for tutor:", tutor);
        return res.status(500).json({ message: "Tutor data is incomplete." });
      }
      console.log("🔍 Checking connectedUsers:", connectedUsers);
      console.log(`🔍 Checking for tutor: ${tutor.userId._id.toString()}`);
      console.log(
        `🔍 Socket ID found:`,
        connectedUsers[tutor.userId._id.toString()]
      );

      sendRealTimeUpdate(
        tutor.userId._id.toString(),
        "booking-request",
        booking
      );

      // ✅ Notify tutor
      sendNotification(
        tutor.userId._id,
        `You have a new booking request from ${student.userId.name} for ${date} at ${time}.`
      );
      sendRealTimeUpdate(tutor.userId._id, "booking-request", booking);

      res.status(201).json({
        success: true,
        message: "Booking request created successfully.",
        booking,
      });
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  },

  /**
   * Tutor accepts a booking
   */
  async acceptBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const tutor = await Tutor.findOne({ userId: req.user.id });

      if (!tutor) {
        return res
          .status(403)
          .json({ message: "Unauthorized. Only tutors can accept bookings." });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.tutorId.toString() !== tutor._id.toString()) {
        return res
          .status(404)
          .json({ message: "Booking not found or unauthorized." });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({ message: "Booking is not pending." });
      }

      booking.status = "confirmed";
      await booking.save();

      sendNotification(booking.studentId, "Your booking has been accepted!");
      sendRealTimeUpdate(booking.studentId, "booking-accepted", booking);

      res
        .status(200)
        .json({ success: true, message: "Booking accepted.", booking });
    } catch (error) {
      console.error("Error accepting booking:", error);
      res.status(500).json({ message: "Failed to accept booking" });
    }
  },

  /**
   * Tutor declines a booking (Refunds booking fee)
   */
  async declineBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const tutor = await Tutor.findOne({ userId: req.user.id });

      if (!tutor) {
        return res
          .status(403)
          .json({ message: "Unauthorized. Only tutors can decline bookings." });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.tutorId.toString() !== tutor._id.toString()) {
        return res
          .status(404)
          .json({ message: "Booking not found or unauthorized." });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({ message: "Booking is not pending." });
      }

      booking.status = "declined";
      await booking.save();

      // Refund booking fee
      const student = await Student.findById(booking.studentId);
      student.walletBalance += BOOKING_FEE;
      await student.save();

      sendNotification(booking.studentId, "Your booking request was declined.");
      sendRealTimeUpdate(booking.studentId, "booking-declined", booking);

      res
        .status(200)
        .json({ success: true, message: "Booking declined and fee refunded." });
    } catch (error) {
      console.error("Error declining booking:", error);
      res.status(500).json({ message: "Failed to decline booking" });
    }
  },

  /**
   * Process payment after the session is completed
   */
  async processSessionPayment(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.status !== "confirmed") {
        return res
          .status(400)
          .json({ message: "Invalid or unconfirmed booking." });
      }

      const student = await Student.findById(booking.studentId);
      const tutor = await Tutor.findById(booking.tutorId);

      if (!student || !tutor) {
        return res.status(404).json({ message: "Student or tutor not found." });
      }

      // Calculate total payment
      const totalAmount = tutor.hourlyRate;
      const platformFee = totalAmount * PLATFORM_COMMISSION;
      const tutorEarnings = totalAmount - platformFee;

      if (student.walletBalance < totalAmount) {
        return res.status(400).json({ message: "Insufficient balance." });
      }

      // Deduct from student's wallet
      student.walletBalance -= totalAmount;
      await student.save();

      // Add earnings to tutor's wallet
      tutor.walletBalance += tutorEarnings;
      await tutor.save();

      // Mark booking as completed
      booking.status = "completed";
      await booking.save();

      // Log transaction
      await Transaction.create({
        studentId: student._id,
        tutorId: tutor._id,
        amount: totalAmount,
        platformFee,
        netEarnings: tutorEarnings,
        status: "success",
      });

      sendNotification(student.userId, "Payment processed successfully.");
      sendNotification(tutor.userId, "You received payment for a session.");
      sendRealTimeUpdate(tutor.userId, "session-paid", booking);

      res.status(200).json({
        success: true,
        message: "Session payment processed successfully.",
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  },

  /**
   * Fetch all bookings for a student
   */
  async getStudentBookings(req, res) {
    try {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) {
        return res.status(403).json({ message: "Unauthorized." });
      }

      const bookings = await Booking.find({ studentId: student._id }).populate(
        "tutorId",
        "name profileImage hourlyRate"
      );
      res.status(200).json({ bookings });
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  },

  /**
   * Fetch all bookings for a tutor
   */
  async getTutorBookings(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user.id });
      if (!tutor) {
        return res.status(403).json({ message: "Unauthorized." });
      }

      const bookings = await Booking.find({ tutorId: tutor._id }).populate(
        "studentId",
        "name profileImage"
      );
      res.status(200).json({ bookings });
    } catch (error) {
      console.error("Error fetching tutor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  },
};

module.exports = BookingController;
