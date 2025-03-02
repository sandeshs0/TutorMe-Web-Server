const express = require("express");
const router = express.Router();
const tutorController = require("../controller/tutorController");
const { authenticateToken, authorizeRole } = require("../security/Auth");
const { uploadTutor } = require("../utils/multerConfig"); // Import explicitly

router.get("/", tutorController.getTutors);
// router.post('/',upload.single('file'), tutorController.create);
// router.get('/:id', tutorController.getById);
// router.delete('/:id', authenticateToken,authorizeRole('admin'),tutorController.deleteById);
router.put(
  "/update-profile",
  authenticateToken,
  uploadTutor.single("profileImage"),
  tutorController.updateTutorProfile
);
router.get("/profile", authenticateToken, tutorController.getTutorProfile);

router.get("/profile/:username", tutorController.getTutorByUsername);

module.exports = router;
