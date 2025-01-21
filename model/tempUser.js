const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "tutor"], required: true },
    otp: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    profileImage: { type: String }, // 
    bio: { type: String }, // Add for tutors
    description: { type: String }, // Add for tutors
    hourlyRate: { type: Number }, // Add for tutors
    subjects: [{ type: String }], // Add for tutors
});

const TempUser = mongoose.model("TempUser", tempUserSchema);
module.exports = TempUser;