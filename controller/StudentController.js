const Student = require("../model/student");
const User = require("../model/user");
const cloudinary = require("../utils/cloudinary");

// Fetch all students (Admin only)
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "name email phone profileImage role")
      .select("-walletBalance"); // Exclude sensitive data like wallet balance

    res.status(200).json({
      message: "Students fetched successfully",
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

// Fetch student profile (Authenticated student)
const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findOne({ userId: studentId }).populate(
      "userId",
      "name email phone profileImage role"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const responseToSend = {
      id: student._id,
      name: student.userId.name,
      email: student.userId.email,
      phone: student.userId.phone,
      profileImage: student.profileImage,
      role: student.userId.role,
      walletBalance: student.walletBalance,
    };
    res.status(200).json({
      message: "Student profile fetched successfully",
      student:responseToSend,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Failed to fetch student profile" });
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { name, email, phone } = req.body;

    let profileImage = req.file?.path; // Use the Cloudinary URL provided by multer

    // Update the user data
    const updatedUser = await User.findByIdAndUpdate(
      studentId,
      { name, email, phone },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    // Update the student's profileImage field if a new image is uploaded
    const updatedStudent = await Student.findOneAndUpdate(
      { userId: studentId }, // Locate the Student document by userId
      { ...(profileImage && { profileImage }) }, // Only update profileImage if it exists
      { new: true }
    ).populate("userId", "name email phone profileImage role");
    res.status(200).json({
      message: "Profile updated successfully",
      updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Failed to update student profile" });
  }
};

module.exports = {
  getAllStudents,
  getStudentProfile,
  updateStudentProfile,
};
