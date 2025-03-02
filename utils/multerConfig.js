const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const tutorStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tutor-profile-images", 
    allowed_formats: ["jpeg", "png", "jpg"],
  },
});

const studentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "student-profile-images", 
    allowed_formats: ["jpeg", "png", "jpg"],
  },
});


const uploadTutor = multer({ storage: tutorStorage });
const uploadStudent = multer({ storage: studentStorage });

module.exports = {
  uploadTutor,
  uploadStudent,
};
