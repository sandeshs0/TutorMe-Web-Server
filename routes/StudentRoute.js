const express = require("express");
const router = express.Router();
const upload = require("../utils/multer"); // Import multer for file uploads
const {
    authenticateToken,
    authorizeRole,
  } = require("../middleware/authMiddleware");
const {
    getAllStudents,
    getStudentProfile,
    updateStudentProfile,
  } = require("../controllers/studentController");

  router.get("/all", authenticateToken, authorizeRole("admin"), getAllStudents); // Admin only
  router.get("/profile", authenticateToken, getStudentProfile); // Authenticated student
  router.put(
    "/profile",
    authenticateToken,
    upload.single("profileImage"),
    updateStudentProfile
  );

  module.exports = router;
