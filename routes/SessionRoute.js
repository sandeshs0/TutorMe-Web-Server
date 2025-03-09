const express = require("express");
const {
  getSessionRoom,
  startSession,
  endSession,
  getJaaSToken,
  getStudentSessions,
  getTutorSessions,
} = require("../controller/SessionController");
const { authenticateToken } = require("../security/Auth");

const router = express.Router();

router.get("/room/:bookingId", authenticateToken, getSessionRoom);
router.put("/start/:bookingId", authenticateToken, startSession);
router.put("/end/:bookingId", authenticateToken, endSession);
router.get("/jaas-token/:bookingId", authenticateToken, getJaaSToken);
router.get("/student", authenticateToken, getStudentSessions);
router.get("/tutor", authenticateToken, getTutorSessions);

module.exports = router;