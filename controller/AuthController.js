const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const Subject = require("../model/subject");
const TempUser = require("../model/tempUser");
const { sendEmail } = require("../utils/emailService");

const SECRET_KEY =
  "c597cfe12544544faa9f04ef0860c5882dd30a5dbd65b567c6a511504823cdd5";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
  console.log("signup attempt:", req.body);
  try {
    const {
      name,
      email,
      username,
      phone,
      password,
      role,
      bio,
      description,
      hourlyRate,
      subjects,
    } = req.body;
    const existingTempUser = await TempUser.findOne({ email });
    const existingUser = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });
    if (existingTempUser || existingUser || existingUsername) {
      return res
        .status(400)
        .json({ message: "User with Email or Username already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    let profileImage = null;
    if (req.file) {
      profileImage = req.file.path;
    }
    const tempUser = new TempUser({
      name,
      email,
      username,
      phone,
      password: hashedPassword,
      role,
      otp,
      otpExpiresAt,
      profileImage,
      ...(role === "tutor" && { bio, description, hourlyRate, subjects }),
    });
    await tempUser.save();
    const htmlContent = `
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
<style>
    body {
        font-family:  'Poppins', sans-serif;;
        background-color: #f4f4f4;
        margin: 0;
        padding: 20px;
        color:rgb(255, 255, 255);
    }
    .container {
        background-color: #121A26;
        width: 100%;
        max-width: 600px;
        border-radius: 8px;
        margin: 0 auto;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
        background-color: #0F1824;
        border-bottom:  1px solid #f9f9f934;
        color: white;
        padding: 10px 20px;
        text-align: left;
    }
    .otp-container {
        display: flex;
        justify-content: center;
    }
    .header img {
        width: 130px;
    }
    .content {
        padding: 20px;
        text-align: left;
    }
    .otp {
        font-size: 32px;
        letter-spacing: 15px;
        padding: 10px 2px;
        font-weight: bold;
        margin: 20px 0;
        padding-left: 30px;
        padding-right: 15px;
        display: inline-block;
        border: 2px dashed #2969ff85;
        border-radius: 10px;
        background-color: #202B3C;
    }
    .footer {
        font-size: 12px;
        text-align: center;
        color: #666;
        padding: 20px;
    }
    .button {
        background-color: transparent;
        color: rgba(132, 164, 237, 0.494);
        border: none;
        font-size: 30px;
        padding: 10px 20px;
        text-align: center;
        display: inline-block;
        margin: 10px 0;
        cursor: pointer;
    }
    .button:hover {
        color: #2969ffa7;
    }

</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Replace src with the path to your logo image -->
            <img src="https://i.postimg.cc/tJh83M61/logostroke.png" alt="Logo">
        </div>
        <div class="content">
            <h1 style="color:#ffffff">Confirm your email address!</h1>
            <p style="color:#ffffff">Hi ${name},</p>
            <p style="color:#ffffff">You're almost there! Please use the one-time password (OTP) below to complete your registration process:</p>
           <div class="otp-container">
            <div class="otp" style="color:#ffffff">${otp}</div>
        </div>
            <p style="color:#ffffff">This code will expire in minutes. If you did not request this, please ignore this message.</p>
            <p style="color:#ffffff">Cheers!<br>
            TutorMe Team<br>
            </p>
        </div>
        <div class="footer">
          
            <small>This is an automated email sent on behalf of tutorMe. Please do not reply to this email.</small><br>
            Kathmandu, Nepal<br>
            &copy; 2024 TutorMe
        </div>
    </div>
</body>
</html>

`;

    await sendEmail(
      email,
      "Verify Your Email",
      "Your OTP is ready.",
      htmlContent
    );

    // Send OTP to user's email
    // await sendEmail(email, "Verify Your Email", `Dear ${name}, \n Your OTP for email verification is: ${otp}. \n This OTP is valid for 5 minutes. \n Thank you!, \n Team TutorMe`);

    res.status(201).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  console.log("verify otp attempt:", req.body);

  try {
    const { email, otp } = req.body;

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res
        .status(404)
        .json({ message: "User not found or already verified" });
    }

    if (tempUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (tempUser.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const {
      name,
      phone,
      password,
      username,
      role,
      bio,
      description,
      hourlyRate,
      subjects,
      profileImage,
    } = tempUser;
    const newUser = new User({ name, username, email, phone, password, role });
    await newUser.save();

    // Role-specific logic
    if (role === "student") {
      const newStudent = new Student({ userId: newUser._id, profileImage });
      await newStudent.save();
    } else if (role === "tutor") {
      const { bio, description, hourlyRate, subjects, profileImage } = tempUser;

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
        profileImage,
      });
      await newTutor.save();
    }

    await TempUser.deleteOne({ email });

    res
      .status(200)
      .json({ message: "Email verified successfully. Registration complete." });
    console.log("Email verified successfully. Registration complete.");
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  console.log("login attempt:", req.body);
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log("Invalid credentials");

      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: "1d",
    });

    res.status(200).json({ message: "Login successful", token, user });
    console.log("Login successful");
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP Function
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res
        .status(404)
        .json({ message: "User not found or already verified" });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    tempUser.otp = otp;
    tempUser.otpExpiresAt = otpExpiresAt;
    await tempUser.save();

    const htmlContent = `
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>
    body {
        font-family:  'Poppins', sans-serif;;
        background-color: #f4f4f4;
        margin: 0;
        padding: 20px;
        color:#ffffff;
    }
    .container {
        background-color: #121A26;
        width: 100%;
        max-width: 600px;
        border-radius: 8px;
        margin: 0 auto;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        color:#ffffff;

    }
    .header {
        background-color: #0F1824;
        border-bottom:  1px solid #f9f9f934;
        color: white;
        padding: 10px 20px;
        text-align: left;
    }
    .otp-container {
        display: flex;
        justify-content: center;
    }
    .header img {
        width: 130px;
    }
    .content {
        padding: 20px;
        text-align: left;
        color:#ffffff;

    }
    .otp {
        font-size: 32px;
        letter-spacing: 15px;
        padding: 10px 2px;
        font-weight: bold;
        margin: 20px 0;
        padding-left: 30px;
        padding-right: 15px;
        display: inline-block;
        border: 2px dashed #2969ff85;
        border-radius: 10px;
        background-color: #202B3C;
    }
    .footer {
        font-size: 12px;
        text-align: center;
        color: #666;
        padding: 20px;
    }
    .button {
        background-color: transparent;
        color: rgba(132, 164, 237, 0.494);
        border: none;
        font-size: 30px;
        padding: 10px 20px;
        text-align: center;
        display: inline-block;
        margin: 10px 0;
        cursor: pointer;
    }
    .button:hover {
        color: #2969ffa7;
    }

</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Replace src with the path to your logo image -->
            <h1>TutorMe</h1>
            // <img src="https://i.postimg.cc/tJh83M61/logostroke.png" alt="Logo">
        </div>
        <div class="content">
            <h1 style="color:#ffffff">Confirm your email address!</h1>
            <p style="color:#ffffff">Your new Verification Code is here. Please use the one-time password (OTP) below to complete your registration process:</p>
           <div class="otp-container">
            <div class="otp">${otp}</div>
        </div>

            <p style="color:#ffffff">This code will expire in minutes. If you did not request this, please ignore this message.</p>
            <p style="color:#ffffff">Cheers!<br>
            TutorMe Team<br>
            </p>
        </div>
        <div class="footer">
          
            <small>This is an automated email sent on behalf of tutorMe. Please do not reply to this email.</small><br>
            Kathmandu, Nepal<br>
            &copy; 2024 TutorMe
        </div>
    </div>
</body>
</html>

`;

    await sendEmail(
      email,
      "Verify Your Email",
      "Your OTP is ready.",
      htmlContent
    );

    res.status(200).json({ message: "New OTP sent to your email." });
  } catch (error) {
    console.error("Error during OTP resend:", error);
    res.status(500).json({ message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user's ID
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcryptjs.compare(
      oldPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

module.exports = { register, verifyEmail, login, resendOTP, changePassword };
