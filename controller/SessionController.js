const Session = require("../model/Session");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const User = require("../model/user");
const Transaction = require("../model/Transaction");
const { sendNotification } = require("../utils/notifications");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// Platform Commission (20%)
const PLATFORM_COMMISSION = 0.2;

const JAAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAAS_API_KEY = process.env.JAAS_API_KEY;
const JAAAS_SECRET = process.env.JAAS_SECRET; // JaaS secret key
const privateKey = process.env.JAAS_PRIVATE_KEY;

async function getJaaSToken(req, res) {
  try {
    const { bookingId } = req.params;
    const session = await Session.findOne({ bookingId })
      .populate({
        path: "tutorId",
        populate: { path: "userId", select: "name email _id" },
      })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email _id" },
      });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const roomName = session.roomId.split("/").pop(); // Extract room name

    // ✅ Ensure tutorId and studentId are populated
    if (!session.tutorId || !session.tutorId.userId) {
      console.error("❌ Tutor user data is missing:", session.tutorId);
      return res.status(500).json({ message: "Tutor user data is missing." });
    }
    if (!session.studentId || !session.studentId.userId) {
      console.error("❌ Student user data is missing:", session.studentId);
      return res.status(500).json({ message: "Student user data is missing." });
    }

    console.log("✅ Tutor Data:", session.tutorId.userId);
    console.log("✅ Student Data:", session.studentId.userId);
    console.log(
      "Jitsi api keys, app id:",
      JAAAS_APP_ID,
      "api key: ",
      JAAAS_API_KEY,
      "secret: ",
      JAAAS_SECRET,
      "private key: ",
      privateKey
    );
    // Generate JWT Token for JaaS
    const payload = {
      aud: "jitsi",
      iss: "chat", // Your JaaS API Key
      sub: JAAAS_APP_ID, // Your JaaS App ID
      room: "*", // Allow joining any room
      exp: Math.floor(Date.now() / 1000) + 3600, // Token valid for 1 hour
      context: {
        user: {
          avatar: session.tutorId.profileImage || "",
          name: session.tutorId.userId.name || "Tutor",
          email: session.tutorId.userId.email || "tutor@example.com",
          id: session.tutorId.userId._id.toString(),
          moderator: true,
        },
        features: {
          livestreaming: false,
          recording: false,
          outboundCall: false,
          transcription: false,
        },
      },
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      header: {
        kid: JAAAS_SECRET,
        typ: "JWT",
      },
    });
    console.log("✅ Jitsi JWT Token:", token);
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("❌ Error generating Jitsi JWT token:", error);
    res.status(500).json({ message: "Failed to generate JWT token." });
  }
}

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

const getTutorSessions = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ userId: req.user.id });
    if (!tutor) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Tutor not found." });
    }

    const sessions = await Session.find({ tutorId: tutor._id })
      .populate("studentId", "userId")
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email profileImage" },
      })
      .select("-__v -createdAt -updatedAt")
      .sort({ date: -1 });

    const modifiedSessions = sessions.map((session) => ({
      sessionId: session._id,
      bookingId: session.bookingId,
      studentId: session.studentId._id,
      studentName: session.studentId.userId.name,
      studentEmail: session.studentId.userId.email,
      profileImage: session.studentId.userId.profileImage,
      roomId: session.roomId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      duration: session.duration,
      actualDuration: session.actualDuration,
      totalFee: session.totalFee,
      platformFee: session.platformFee,
      tutorEarnings: session.tutorEarnings,
    }));

    res.status(200).json({ success: true, sessions: modifiedSessions });
  } catch (error) {
    console.error("Error fetching tutor sessions:", error);
    res.status(500).json({ message: "Failed to fetch tutor sessions." });
  }
};

const getStudentSessions = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Student not found." });
    }
    // Ensure the student's ID is a valid ObjectId
    // if (!mongoose.Types.ObjectId.isValid(student._id)) {
    //   return res.status(400).json({ message: "Invalid student ID." });
    // }

    const sessions = await Session.find({ studentId: student._id })
      .populate("tutorId", "userId")
      .populate({
        path: "tutorId",
        populate: { path: "userId", select: "name email profileImage" },
      })
      .select("-__v -createdAt -updatedAt")
      .sort({ date: -1 });

    const modifiedSessions = sessions.map((session) => ({
      sessionId: session._id,
      bookingId: session.bookingId,
      tutorId: session.tutorId._id,
      tutorName: session.tutorId.userId.name,
      tutorEmail: session.tutorId.userId.email,
      profileImage: session.tutorId.userId.profileImage,
      roomId: session.roomId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      duration: session.duration,
      actualDuration: session.actualDuration,
      totalFee: session.totalFee,
      platformFee: session.platformFee,
      tutorEarnings: session.tutorEarnings,
    }));

    res.status(200).json({ success: true, sessions: modifiedSessions });
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    res.status(500).json({ message: "Failed to fetch student sessions." });
  }
};

module.exports = {
  getSessionRoom,
  startSession,
  endSession,
  getJaaSToken,
  getTutorSessions,
  getStudentSessions,
};
