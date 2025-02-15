const express = require("express");
const { getSessionRoom, startSession, endSession } = require("../controller/SessionController");
const {authenticateToken} = require("../security/Auth");

const router = express.Router();

router.get("/:bookingId", authenticateToken, getSessionRoom);
router.put("/start/:bookingId", authenticateToken, startSession);
router.put("/end/:bookingId", authenticateToken, endSession);

module.exports = router;
