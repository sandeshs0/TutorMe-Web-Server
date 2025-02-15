const Session = require("../model/Session");

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

async function endSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await Session.findById(sessionId).populate("bookingId");
  
      if (!session) {
        return res.status(404).json({ message: "Session not found." });
      }
  
      const endTime = new Date();
      const durationInMs = endTime - new Date(session.startTime);
      const durationInHours = durationInMs / (1000 * 60 * 60); // Convert to hours
  
      session.duration = durationInHours;
      session.status = "completed";
      await session.save();
  
      // Charge Student and Credit Tutor
      const student = await Student.findById(session.studentId);
      const tutor = await Tutor.findById(session.tutorId);
      const hourlyRate = tutor.hourlyRate;
      const totalCharge = hourlyRate * durationInHours;
  
      if (student.walletBalance < totalCharge) {
        return res.status(400).json({ message: "Insufficient balance." });
      }
  
      // Deduct from Student
      student.walletBalance -= totalCharge;
      await student.save();
  
      // Add Earnings to Tutor
      const platformFee = totalCharge * 0.2;
      tutor.walletBalance += totalCharge - platformFee;
      await tutor.save();
  
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
  
  

module.exports = { getSessionRoom , endSession};
