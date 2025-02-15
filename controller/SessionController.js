const Session = require("../model/Session");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const User = require("../model/user");
const Transaction = require("../model/Transaction");
const { sendNotification } = require("../utils/notifications");

// Platform Commission (20%)
const PLATFORM_COMMISSION = 0.2;

/**
 * Get session room details
 */
async function getSessionRoom(req, res) {
  try {
    const { bookingId } = req.params;
    const session = await Session.findOne({ bookingId });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    res.status(200).json({
      success: true,
      roomId: session.roomId,
      startTime: session.startTime,
      status: session.status,
    });
  } catch (error) {
    console.error("Error fetching session room:", error);
    res.status(500).json({ message: "Failed to fetch session room." });
  }
}

/**
 * Start a session
 */
async function startSession(req, res) {
  try {
    const { bookingId } = req.params;
    const session = await Session.findOne({ bookingId }).populate(
      "studentId tutorId"
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (session.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Session has already started or ended." });
    }

    const user = await User.findById(req.user.id);
    const isStudent =
      session.studentId.userId.toString() === user._id.toString();
    const isTutor = session.tutorId.userId.toString() === user._id.toString();

    if (!isStudent && !isTutor) {
      return res
        .status(403)
        .json({ message: "Unauthorized to start this session." });
    }

    session.status = "in-progress";
    session.startTime = new Date(); // Store actual start time
    await session.save();

    sendNotification(session.studentId.userId, "Your session has started!");
    sendNotification(session.tutorId.userId, "You have started a session.");

    res.status(200).json({
      success: true,
      message: "Session started successfully.",
      session,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ message: "Failed to start session." });
  }
}

/**
 * End a session and process payment
 */
async function endSession(req, res) {
  try {
    const { bookingId } = req.params;
    const session = await Session.findOne({ bookingId }).populate(
      "studentId tutorId"
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (session.status !== "in-progress") {
      return res.status(400).json({ message: "Session is not ongoing." });
    }

    const endTime = new Date();
    const durationInMs = endTime - new Date(session.startTime);
    const durationInHours = durationInMs / (1000 * 60 * 60); // Convert to hours
    session.duration = durationInHours;
    session.status = "completed";
    await session.save();

    // Charge Student and Credit Tutor
    const student = session.studentId;
    const tutor = session.tutorId;
    const hourlyRate = tutor.hourlyRate;
    const totalCharge = hourlyRate * durationInHours;
    const platformFee = totalCharge * PLATFORM_COMMISSION;
    const tutorEarnings = totalCharge - platformFee;

    if (student.walletBalance < totalCharge) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    // Deduct from Student
    student.walletBalance -= totalCharge;
    await student.save();

    // Add Earnings to Tutor
    tutor.walletBalance += tutorEarnings;
    await tutor.save();

    // Log transaction
    await Transaction.create({
      studentId: student._id,
      tutorId: tutor._id,
      amount: totalCharge,
      platformFee,
      netEarnings: tutorEarnings,
      status: "success",
    });

    sendNotification(
      student.userId,
      "Your session has ended. Payment deducted."
    );
    sendNotification(
      tutor.userId,
      "Session completed. Earnings credited to your wallet."
    );

    res.status(200).json({
      success: true,
      message: "Session ended successfully.",
      duration: durationInHours,
      totalCharge,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ message: "Failed to end session." });
  }
}

module.exports = { getSessionRoom, startSession, endSession };
