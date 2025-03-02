const mongoose = require("mongoose");

const tutorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bio: { type: String, required: true },
    description: { type: String, required: true },
    hourlyRate: { type: Number, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    availability: { type: String },
    rating: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    dateJoined: { type: Date, default: Date.now },
    profileImage: { type: String },
});

const Tutor = mongoose.model("Tutor", tutorSchema);
module.exports = Tutor;
