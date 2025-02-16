const express = require("express");
const { getSessionRoom, startSession, endSession, getJaaSToken } = require("../controller/SessionController");
const {authenticateToken} = require("../security/Auth");

const router = express.Router();

router.get("/:bookingId", authenticateToken, getSessionRoom);
router.put("/start/:bookingId", authenticateToken, startSession);
router.put("/end/:bookingId", authenticateToken, endSession);
router.get("/jaas-token/:bookingId", authenticateToken, getJaaSToken);


module.exports = router;
