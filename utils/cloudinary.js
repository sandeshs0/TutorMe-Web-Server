const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with your credentials
// cloudinary.config({
//     cloud_name: "dq6uo6xuh",
//     api_key: "515721181823387",
//     api_secret: "Kuo-ZOUPl7RaAjHoIxQMfAO6pOY",
// });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


module.exports = cloudinary;
