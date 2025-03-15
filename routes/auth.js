// routes/auth

const express = require("express");

const {
  register,
  login,
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
} = require("../controllers/auth");

const router = express.Router();

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

router.post("/register", register);
router.post("/login", login);

module.exports = router;
