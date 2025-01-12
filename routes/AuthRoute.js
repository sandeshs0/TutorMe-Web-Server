const express=require("express");
const router=express.Router();
const {register,login, verifyEmail, resendOTP}=require("../controller/AuthController");

router.post("/register",register);
router.post("/login",login);
router.post("/verify-email",verifyEmail);
router.post("/resend-otp",resendOTP);


module.exports=router;