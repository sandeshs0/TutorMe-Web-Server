const express = require("express");
const BookingController = require("../controller/BookingController");
const {authenticateToken} = require("../security/Auth");

const router = express.Router();

router.post("/request", authenticateToken, BookingController.createBooking);

router.put("/accept/:bookingId", authenticateToken, BookingController.acceptBooking);

router.put("/decline/:bookingId", authenticateToken, BookingController.declineBooking);

router.get("/student", authenticateToken, BookingController.getStudentBookings);

router.get("/tutor", authenticateToken, BookingController.getTutorBookings);

router.put("/complete/:bookingId", authenticateToken, BookingController.processSessionPayment);

module.exports = router;
