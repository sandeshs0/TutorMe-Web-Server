const Session = require("../model/Session");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const User = require("../model/user");
const Earning = require("../model/Earning");
const Transaction = require("../model/Transaction");
const { sendNotification } = require("../utils/notifications");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { profile } = require("console");
require("dotenv").config();

// Platform Commission (20%)
const PLATFORM_COMMISSION = 0.2;
const JAAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAAS_API_KEY = process.env.JAAS_API_KEY;
const JAAAS_SECRET = process.env.JAAS_SECRET; 
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

    if (!session || !session.roomId) {
      return res.status(404).json({ message: "Session or room not found." });
    }
    // console.log("Inside (getjaastoken) Session Data:", session);
    const user = await User.findById(req.user.id);
    console.log("User Data:", user, "req ma aako user data:", req.user);
    // const isTutor = session.tutorId.userId.toString() === user._id.toString();
    console.log("role in req: ", req.user.role);
    const isTutor = req.user.role === "tutor";
    console.log(" jaas token magne User Role:", User.role, "isTutor:", isTutor);
    const roomName = session.roomId;
    const userData = isTutor
      ? session.tutorId.userId
      : session.studentId.userId;
    const profileData = isTutor ? session.tutorId : session.studentId;
    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: JAAAS_APP_ID,
      room: roomName.split("/")[1], // Specific room only
      exp: Math.floor(Date.now() / 1000) + 3600,
      context: {
        user: {
          avatar: profileData.profileImage || "",
          name: userData.name || "User",
          email: userData.email || "",
          id: user._id.toString(),
          moderator: isTutor,
        },
        features: {
          livestreaming: false,
          recording: false,
        },
      },
    };
    console.log(
      "JWT Payload for user:",
      user._id,
      "Role:",
      isTutor ? "Tutor" : "Student",
      payload
    );
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      header: { kid: JAAAS_SECRET, typ: "JWT" },
    });

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error generating Jitsi JWT token:", error);
    res.status(500).json({ message: "Failed to generate JWT token." });
  }
}

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
      roomPassword: session,
      startTime: session.startTime,
      status: session.status,
    });
  } catch (error) {
    console.error("Error fetching session room:", error);
    res.status(500).json({ message: "Failed to fetch session room." });
  }
}

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
    const isTutor = session.tutorId.userId.toString() === user._id.toString();

    if (!isTutor) {
      return res
        .status(403)
        .json({ message: "Only tutors can start sessions." });
    }

    // Generate room credentials
    const roomId = `${JAAAS_APP_ID}/${bookingId}`;
    const roomPassword = crypto.randomBytes(8).toString("hex"); 

    session.status = "in-progress";
    session.startTime = new Date();
    session.roomId = roomId;
    session.roomPassword = roomPassword;
    await session.save();

    sendNotification(
      session.studentId.userId,
      "Your session has started! Join now."
    );
    sendNotification(session.tutorId.userId, "You have started the session.");

    res.status(200).json({
      success: true,
      message: "Session started successfully.",
      session: { roomId, roomPassword, startTime: session.startTime },
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ message: "Failed to start session." });
  }
}

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

    const user = await User.findById(req.user.id);
    const isTutor = session.tutorId.userId.toString() === user._id.toString();

    if (!isTutor) {
      return res.status(403).json({ message: "Only tutors can end sessions." });
    }

    const endTime = new Date();
    const durationInMs = endTime - new Date(session.startTime);
    const durationInHours = durationInMs / (1000 * 60 * 60);
    session.duration = durationInHours;

    const student = session.studentId;
    const tutor = session.tutorId;
    const hourlyRate = tutor.hourlyRate;
    const totalCharge = hourlyRate * durationInHours;
    const platformFee = totalCharge * PLATFORM_COMMISSION;
    const tutorEarnings = totalCharge - platformFee;
    session.status = "completed";
    session.tutorEarnings = tutorEarnings;
    session.totalFee = totalCharge;
    session.platformFee = platformFee;
    session.endTime = endTime;
    session.actualDuration = durationInHours;
    await session.save();

    if (student.walletBalance < totalCharge) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    student.walletBalance -= totalCharge;
    const earning = new Earning({
      tutorId: tutor._id,
      studentId: session.studentId,
      amount: tutorEarnings,
      type: "SessionFee",
    });
    await earning.save();
    tutor.walletBalance += tutorEarnings;
    await Promise.all([student.save(), tutor.save()]);

    sendNotification(
      student.userId,
      `Your session has ended. Rs.${totalCharge} has been deducted from your wallet.`
    );
    sendNotification(
      tutor.userId,
      `Bravo! Session completed. Rs. ${tutorEarnings} credited!`
    );

    res.status(200).json({
      success: true,
      message: "Session ended successfully.",
      duration: durationInHours,
      totalCharge,
    });
    console.log("Session ended successfully.");
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