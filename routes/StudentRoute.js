const express = require("express");
const router = express.Router();
// const upload = require("../utils/multerConfig");
const { uploadStudent } = require("../utils/multerConfig");

const {
  authenticateToken,
  authorizeRole,
} = require("../security/Auth");
const {
  getAllStudents,
  getStudentProfile,
  updateStudentProfile,
} = require("../controller/StudentController");

router.get("/all", authenticateToken, authorizeRole("admin"), getAllStudents); 
router.get("/profile", authenticateToken, getStudentProfile); 
router.put(
  "/profile",
  authenticateToken,
  uploadStudent.single("profileImage"),
  updateStudentProfile
);

module.exports = router;
