const express = require("express");
const BookingController = require("../controller/BookingController");
const {authenticateToken} = require("../security/Auth");

const router = express.Router();

// Student requests a session booking
router.post("/request", authenticateToken, BookingController.createBooking);

// Tutor accepts a booking request
router.put("/accept/:bookingId", authenticateToken, BookingController.acceptBooking);

// Tutor declines a booking request (refunds the booking fee)
router.put("/decline/:bookingId", authenticateToken, BookingController.declineBooking);

// Get all bookings for a student
router.get("/student", authenticateToken, BookingController.getStudentBookings);

// Get all bookings for a tutor
router.get("/tutor", authenticateToken, BookingController.getTutorBookings);

// Process session payment after session completion
router.put("/complete/:bookingId", authenticateToken, BookingController.processSessionPayment);

module.exports = router;
