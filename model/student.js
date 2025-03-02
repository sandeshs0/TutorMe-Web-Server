const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletBalance: { type: Number, default: 0 }, 
  profileImage: { type: String },
  dateJoined: { type: Date, default: Date.now },
});

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
