const express = require("express");
const router = express.Router();
// const upload = require("../utils/multerConfig");
const { uploadStudent } = require("../utils/multerConfig"); // Import explicitly

const {
  authenticateToken,
  authorizeRole,
} = require("../security/Auth");
const {
  getAllStudents,
  getStudentProfile,
  updateStudentProfile,
} = require("../controller/StudentController");

router.get("/all", authenticateToken, authorizeRole("admin"), getAllStudents); // Admin only
router.get("/profile", authenticateToken, getStudentProfile); // Authenticated student
router.put(
  "/profile",
  authenticateToken,
  uploadStudent.single("profileImage"),
  updateStudentProfile
);

module.exports = router;
