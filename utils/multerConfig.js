const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

// Configure Multer to use Cloudinary as storage
const tutorStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tutor-profile-images", // Cloudinary folder name for tutors
    allowed_formats: ["jpeg", "png", "jpg"],
  },
});

const studentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "student-profile-images", // Cloudinary folder name for students
    allowed_formats: ["jpeg", "png", "jpg"],
  },
});

// Create Multer instances for both
const uploadTutor = multer({ storage: tutorStorage });
const uploadStudent = multer({ storage: studentStorage });

module.exports = {
  uploadTutor,
  uploadStudent,
};
