const express=require("express");
const router=express.Router();
const {register,login, verifyEmail, resendOTP, changePassword}=require("../controller/AuthController");
const {uploadTutor} = require("../utils/multerConfig");
const { authenticateToken, authorizeRole } = require("../security/Auth");


router.post("/register",uploadTutor.single("profileImage"),register);
router.post("/login",login);
router.post("/verify-email",verifyEmail);
router.post("/resend-otp",resendOTP);
router.post(
    "/change-password",
    authenticateToken,
    changePassword,
  );
  
module.exports=router;