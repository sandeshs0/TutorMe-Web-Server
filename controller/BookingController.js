const Booking = require("../model/Booking");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const Earning = require("../model/Earning");
const Session = require("../model/Session");
const User = require("../model/user");
const Transaction = require("../model/Transaction"); 
const { sendNotification } = require("../utils/notifications");
const { date } = require("joi");

const BOOKING_FEE = 30;
// Platform Commission (20%)
const PLATFORM_COMMISSION = 0.2;

const sendRealTimeUpdate = (userId, event, data) => {
  if (!userId) {
    console.error("Invalid userId provided for WebSocket event.");
    return;
  }

  const socketId = global.connectedUsers[userId.toString()];
  console.log(" Checking connectedUsers:", global.connectedUsers);
  console.log(` Checking for user: ${userId}, Found socket ID:`, socketId);
  if (!global.io) {
    console.error(" io is undefined! WebSocket might not be initialized.");
    return;
  }

  if (socketId) {
    global.io.to(socketId).emit(event, data);
    console.log(` WebSocket Event Sent: ${event} to user ${userId}`);
  } else {
    console.warn(`User ${userId} is not online. Storing notification.`);
    sendNotification(userId, `You have a new ${event}`);
  }
};

const BookingController = {
  
  async createBooking(req, res) {
    console.log("creating booking: ", req.body);
    try {
      const { tutorId, date, time, note } = req.body;
      const student = await Student.findOne({ userId: req.user.id });
      const studentObject = await User.findOne({ _id: req.user.id });
      if (!student) {
        return res.status(404).json({ message: "Student profile not found." });
      }

      const tutor = await Tutor.findById(tutorId).populate("userId", "id");

      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found." });
      }

      if (!tutor.userId) {
        console.error(" Tutor userId is missing for tutor:", tutor);
        return res.status(500).json({ message: "Tutor data is incomplete." });
      }

      console.log(" Tutor found:", tutor);

      if (student.walletBalance < tutor.hourlyRate + BOOKING_FEE) {
        return res
          .status(400)
          .json({ message: "Insufficient wallet balance." });
      }

      student.walletBalance -= BOOKING_FEE;
      await student.save();

      const booking = new Booking({
        studentId: student._id,
        tutorId,
        date,
        startTime: time,
        note,
        status: "pending",
      });

      await booking.save();
      console.log(" Booking created:", booking);
      console.log(" Tutor fetched:", tutor);

      if (!tutor || !tutor.userId) {
        console.log(" Tutor userId is missing for tutor:", tutor);
        return res.status(500).json({ message: "Tutor data is incomplete." });
      }
      console.log("Checking connectedUsers:", connectedUsers);
      console.log(` Checking for tutor: ${tutor.userId._id.toString()}`);
      console.log(
        ` Socket ID found:`,
        connectedUsers[tutor.userId._id.toString()]
      );
      sendNotification(
        tutor.userId._id,
        `You have a new booking request from ${studentObject.name} for ${date} at ${time}.`
      );
      sendRealTimeUpdate(tutor.userId._id, "booking-request", booking);

      res.status(201).json({
        success: true,
        message: "Booking request created successfully.",
        booking,
      });
      console.log("booking created");
    } catch (error) {
      console.error(" Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  },

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

      
      const sessionRoom = `https://meet.jit.si/session_${booking._id}`;

      const session = new Session({
        tutorId: tutor._id,
        hourlyRate: tutor.hourlyRate,
        studentId: booking.studentId._id,
        bookingId: booking._id,
        roomId: sessionRoom,
        date: booking.date,
        startTime: booking.date,
        duration: 0, // Will be updated later
        status: "scheduled",
      });
      await session.save();

      const studentUser = await Student.findById(booking.studentId);
      const tutorUser = await User.findById(tutor.userId);
      console.log("🔍 Student user found:", studentUser);
      booking.status = "accepted";
      await booking.save();
      console.log(" Booking accepted:", booking);
      console.log("sending notification to user id", studentUser.userId._id);
      sendNotification(
        studentUser.userId._id,
        `${tutorUser.name} has accepted your session request. Check the sessions tab.`
      );
      const tutorEarning = new Earning({
        tutorId: tutor._id,
        studentId: booking.studentId,
        amount: BOOKING_FEE,
        type: "BookingFee",
      });
      await tutorEarning.save();
      // Add booking fee from student's wallet
      tutor.walletBalance += BOOKING_FEE;
      await tutor.save();
      sendNotification(
        tutor.userId,
        "You have accepted a session request. Booking fee credited!"
      );
      res.status(200).json({
        success: true,
        message: "Booking accepted.",
        booking,
        sessionRoom,
      });
    } catch (error) {
      console.error("Error accepting booking:", error);
      res.status(500).json({ message: "Failed to accept booking" });
    }
  },


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
      console.log(" Booking declined:", booking);
      // const studentUser = await Student.findById(booking.studentId);
      const tutorUser = await User.findById(tutor.userId);

      // Refund booking fee
      const student = await Student.findById(booking.studentId);
      student.walletBalance += BOOKING_FEE;
      await student.save();

      sendNotification(
        student.userId._id,
        `Unfortunately, ${tutorUser.name} declined your session request. Your booking fee has been refunded.`
      );
      sendRealTimeUpdate(student.userId._id, "booking-declined", booking);

      res
        .status(200)
        .json({ success: true, message: "Booking declined and fee refunded." });
    } catch (error) {
      console.error("Error declining booking:", error);
      res.status(500).json({ message: "Failed to decline booking" });
    }
  },


  async processSessionPayment(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.status !== "accepted") {
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
  // async getStudentBookings(req, res) {
  //   try {
  //     const student = await Student.findOne({ userId: req.user.id });
  //     if (!student) {
  //       return res.status(403).json({ message: "Unauthorized." });
  //     }

  //     const bookings = await Booking.find({ studentId: student._id }).populate(
  //       "tutorId",
  //       "id name profileImage hourlyRate"
  //     );
  //     res.status(200).json({ bookings });
  //   } catch (error) {
  //     console.error("Error fetching student bookings:", error);
  //     res.status(500).json({ message: "Failed to fetch bookings" });
  //   }
  // },

  // async getStudentBookings(req, res) {
  //   try {
  //     const student = await Student.findOne({ userId: req.user.id });
  //     if (!student) {
  //       return res.status(403).json({ message: "Unauthorized." });
  //     }

  //     const bookings = await Booking.find({ studentId: student._id }).populate(
  //       "tutorId",
  //       "_id name profileImage hourlyRate"
  //     );

  //     // Transform the response to replace _id with id in tutorId
  //     const modifiedBookings = bookings.map((booking) => ({
  //       ...booking.toObject(),
  //       tutorId: {
  //         id: booking.tutorId._id, // Change _id to id
  //         name: booking.tutorId.name,
  //         profileImage: booking.tutorId.profileImage,
  //         hourlyRate: booking.tutorId.hourlyRate,
  //       },
  //     }));

  //     res.status(200).json({ bookings: modifiedBookings });
  //   } catch (error) {
  //     console.error("Error fetching student bookings:", error);
  //     res.status(500).json({ message: "Failed to fetch bookings" });
  //   }
  // },

  // async getStudentBookings(req, res) {
  //   try {
  //     const student = await Student.findOne({ userId: req.user.id });
  //     if (!student) {
  //       return res.status(403).json({ message: "Unauthorized." });
  //     }

  //     const bookings = await Booking.find({ studentId: student._id })
  //       .populate("tutorId", "_id name profileImage hourlyRate")
  //       .select("-createdAt -updatedAt -__v")
  //       .sort({ createdAt: -1 });

  //     // Transform the response to replace tutorId with tutorObj
  //     const modifiedBookings = bookings.map((booking) => {
  //       const bookingObj = booking.toObject(); // Convert Mongoose document to plain object
  //       const { tutorId, ...rest } = bookingObj; // Destructure to remove tutorId

  //       return {
  //         ...rest,
  //         tutorId: tutorId._id,
  //         tutorObj: {
  //           id: tutorId._id, // Change _id to id
  //           name: tutorId.name,
  //           profileImage: tutorId.profileImage,
  //           hourlyRate: tutorId.hourlyRate,
  //         },
  //       };
  //     });

  //     res.status(200).json({ bookings: modifiedBookings });
  //   } catch (error) {
  //     console.error("Error fetching student bookings:", error);
  //     res.status(500).json({ message: "Failed to fetch bookings" });
  //   }
  // },

  async getStudentBookings(req, res) {
    try {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) {
        return res.status(403).json({ message: "Unauthorized." });
      }

      const bookings = await Booking.find({ studentId: student._id })
        .populate({
          path: "tutorId",
          populate: { path: "userId", select: "name" },
        })
        .select("-createdAt -updatedAt -__v")
        .sort({ createdAt: -1 });

      const modifiedBookings = bookings.map((booking) => {
        const bookingObj = booking.toObject(); 
        const { tutorId, ...rest } = bookingObj; 

        return {
          ...rest,
          tutorId: tutorId._id, 
          tutorName: tutorId.userId.name,
          profileImage: tutorId.profileImage,
          hourlyRate: tutorId.hourlyRate,
        };
      });

      res.status(200).json({ bookings: modifiedBookings });
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  },

  async getTutorBookings(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user.id });
      if (!tutor) {
        return res.status(403).json({ message: "Unauthorized." });
      }

      const bookings = await Booking.find({ tutorId: tutor._id })
        .populate({
          path: "studentId", 
          select: "userId profileImage", 
          populate: {
            path: "userId", 
            select: "name", 
          },
        })
        .sort({ createdAt: -1 });
      res.status(200).json({ bookings });
    } catch (error) {
      console.error("Error fetching tutor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  },
};

module.exports = BookingController;
