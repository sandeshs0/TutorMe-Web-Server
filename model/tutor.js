const mongoose = require("mongoose");

const tutorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bio: { type: String, required: true },
    description: { type: String, required: true },
    hourlyRate: { type: Number, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    availability: { type: String }, // JSON or structured format
    rating: { type: Number, default: 0 },
    image: { type: String }, // Path to the image file
    walletBalance: { type: Number, default: 0 }, // Earnings balance
    dateJoined: { type: Date, default: Date.now },
});

const Tutor = mongoose.model("Tutor", tutorSchema);
module.exports = Tutor;
