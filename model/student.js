const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    walletBalance: { type: Number, default: 0 }, // Funds for booking sessions
    dateJoined: { type: Date, default: Date.now },
});

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;