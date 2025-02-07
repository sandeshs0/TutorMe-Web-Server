const Booking = require("../model/Booking");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const Transaction = require("../model/Transaction"); // For tracking transactions
const { sendNotification } = require("../utils/notifications"); // Utility for notifications

const BOOKING_FEE = 30; // Fee to prevent fraudulent bookings
const PLATFORM_COMMISSION = 0.2; // 20% platform commission

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

      const tutor = await Tutor.findById(tutorId);
      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found." });
      }

      // Check if student has enough balance for at least 1 hour of tutoring
      if (student.walletBalance < tutor.hourlyRate + BOOKING_FEE) {
        return res.status(400).json({ message: "Insufficient wallet balance." });
      }

      // Deduct booking fee from student's wallet
      student.walletBalance -= BOOKING_FEE;
      await student.save();

      const booking = new Booking({
        studentId: student._id,
        tutorId,
        date,
        time,
        note,
        status: "pending",
      });

      await booking.save();

      // Send notification to tutor
      sendNotification(tutor.userId, "New booking request received.");

      res.status(201).json({
        success: true,
        message: "Booking request created successfully.",
        booking,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
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
        return res.status(403).json({ message: "Unauthorized. Only tutors can accept bookings." });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.tutorId.toString() !== tutor._id.toString()) {
        return res.status(404).json({ message: "Booking not found or unauthorized." });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({ message: "Booking is not pending." });
      }

      booking.status = "confirmed";
      await booking.save();

      sendNotification(booking.studentId, "Your booking has been accepted!");

      res.status(200).json({ success: true, message: "Booking accepted.", booking });
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
        return res.status(403).json({ message: "Unauthorized. Only tutors can decline bookings." });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.tutorId.toString() !== tutor._id.toString()) {
        return res.status(404).json({ message: "Booking not found or unauthorized." });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({ message: "Booking is not pending." });
      }

      booking.status = "declined";
      await booking.save();

      // Refund the booking fee
      const student = await Student.findById(booking.studentId);
      student.walletBalance += BOOKING_FEE;
      await student.save();

      sendNotification(booking.studentId, "Your booking request was declined.");

      res.status(200).json({ success: true, message: "Booking declined and fee refunded." });
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
        return res.status(400).json({ message: "Invalid or unconfirmed booking." });
      }

      const student = await Student.findById(booking.studentId);
      const tutor = await Tutor.findById(booking.tutorId);

      if (!student || !tutor) {
        return res.status(404).json({ message: "Student or tutor not found." });
      }

      // Calculate payment (subtracting platform commission)
      const totalAmount = tutor.hourlyRate;
      const platformFee = totalAmount * PLATFORM_COMMISSION;
      const tutorEarnings = totalAmount - platformFee;

      if (student.walletBalance < totalAmount) {
        return res.status(400).json({ message: "Student has insufficient funds." });
      }

      // Deduct amount from student's wallet
      student.walletBalance -= totalAmount;
      await student.save();

      // Add earnings to tutor's wallet
      tutor.walletBalance += tutorEarnings;
      await tutor.save();

      // Mark booking as completed
      booking.status = "completed";
      await booking.save();

      // Record the transaction
      await Transaction.create({
        studentId: student._id,
        tutorId: tutor._id,
        amount: totalAmount,
        platformFee,
        netEarnings: tutorEarnings,
        status: "success",
      });

      sendNotification(student.userId, "Payment successfully processed for your session.");
      sendNotification(tutor.userId, "You have received payment for a session.");

      res.status(200).json({ success: true, message: "Session payment processed successfully." });
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

      const bookings = await Booking.find({ studentId: student._id }).populate("tutorId", "name profileImage hourlyRate");
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

      const bookings = await Booking.find({ tutorId: tutor._id }).populate("studentId", "name profileImage");
      res.status(200).json({ bookings });
    } catch (error) {
      console.error("Error fetching tutor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  },
};

module.exports = BookingController;
