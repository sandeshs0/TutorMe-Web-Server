const express = require("express");
const Earning = require("../model/Earning");
const Tutor = require("../model/tutor");
const { authenticateToken } = require("../security/Auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  console.log("Fetching earnings for tutor", req.user.id);
  try {
    const tutor = await Tutor.findOne({ userId: req.user.id });
    const earnings = await Earning.find({ tutorId: tutor._id })
      .sort({ date: -1 })

    res.status(200).json(earnings);
  } catch (error) {
    console.error("Error fetching earnings", error);
    res.status(500).json({ message: "Failed to fetch earning" });
  }
});

module.exports = router;