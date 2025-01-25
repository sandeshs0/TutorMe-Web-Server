const express = require("express");
const router = express.Router();
const tutorController = require("../controller/tutorController");
const { authenticateToken, authorizeRole } = require("../security/Auth");
const upload = require("../utils/multerConfig");

router.get("/", tutorController.getTutors);
// router.post('/',upload.single('file'), tutorController.create);
// router.get('/:id', tutorController.getById);
// router.delete('/:id', authenticateToken,authorizeRole('admin'),tutorController.deleteById);
router.put(
  "/update-profile",
  authenticateToken,
  upload.single("profileImage"), // Handle single file upload with key "profileImage"
  tutorController.updateTutorProfile
);

module.exports = router;
