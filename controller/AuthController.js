const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const Subject = require("../model/subject");
const TempUser = require("../model/tempUser"); // Temp User Model
const { sendEmail } = require("../utils/emailService"); // Email Utility

const SECRET_KEY = "c597cfe12544544faa9f04ef0860c5882dd30a5dbd65b567c6a511504823cdd5";

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

// Register Function
const register = async (req, res) => {
    try {
        const { name, email, phone, password, role, bio, description, hourlyRate, subjects } = req.body;

        // Check if the email or phone already exists
        const existingTempUser = await TempUser.findOne({ email });
        const existingUser = await User.findOne({ email });
        if (existingTempUser || existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Save user data in tempUsers
        const tempUser = new TempUser({
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            otp,
            otpExpiresAt,
        });
        await tempUser.save();

        // Send OTP to user's email
        await sendEmail(email, "Verify Your Email", `Your OTP for email verification is: ${otp}`);

        res.status(201).json({ message: "OTP sent to your email. Please verify to complete registration." });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: error.message });
    }
};

// Verify Email Function
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find the user in tempUsers
        const tempUser = await TempUser.findOne({ email });
        if (!tempUser) {
            return res.status(404).json({ message: "User not found or already verified" });
        }

        // Check OTP validity
        if (tempUser.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        if (tempUser.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Move the user to the users collection
        const { name, phone, password, role } = tempUser;
        const newUser = new User({ name, email, phone, password, role });
        await newUser.save();

        // Role-specific logic
        if (role === "student") {
            const newStudent = new Student({ userId: newUser._id });
            await newStudent.save();
        } else if (role === "tutor") {
            const { bio, description, hourlyRate, subjects } = tempUser;

            let subjectIds = [];
            if (subjects && subjects.length > 0) {
                subjectIds = await Promise.all(
                    subjects.map(async (subjectName) => {
                        let subject = await Subject.findOne({ name: subjectName });
                        if (!subject) {
                            subject = new Subject({ name: subjectName });
                            await subject.save();
                        }
                        return subject._id;
                    })
                );
            }

            const newTutor = new Tutor({
                userId: newUser._id,
                bio,
                description,
                hourlyRate,
                subjects: subjectIds,
            });
            await newTutor.save();
        }

        // Delete the user from tempUsers
        await TempUser.deleteOne({ email });

        res.status(200).json({ message: "Email verified successfully. Registration complete." });
    } catch (error) {
        console.error("Error during email verification:", error);
        res.status(500).json({ message: error.message });
    }
};

// Login Function
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate a token
        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token, user });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: error.message });
    }
};

// Resend OTP Function
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Find the user in tempUsers
        const tempUser = await TempUser.findOne({ email });
        if (!tempUser) {
            return res.status(404).json({ message: "User not found or already verified" });
        }

        // Generate a new OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Update OTP in tempUsers
        tempUser.otp = otp;
        tempUser.otpExpiresAt = otpExpiresAt;
        await tempUser.save();

        // Resend OTP via email
        await sendEmail(email, "Verify Your Email", `Your new OTP is: ${otp}`);

        res.status(200).json({ message: "New OTP sent to your email." });
    } catch (error) {
        console.error("Error during OTP resend:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, verifyEmail, login, resendOTP };
