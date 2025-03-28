const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const nodemailer = require("nodemailer");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    if (!email && !phone && !name) {
      return res
        .status(400)
        .json({ error: "Email, phone or username is required" });
    }

    // filter out or null undefined values before querying
    const queryConditions = [];
    if (email) queryConditions.push({ email });
    if (phone) queryConditions.push({ phone });
    if (name) queryConditions.push({ name });

    const existingUser = await User.findOne({
      $or: queryConditions,
    });

    if (existingUser)
      return res.status(400).json({ error: `user already exists` });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, phone, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: `registration sucessfull!` });
  } catch (error) {
    res.status(500).json({ error: `error registering user: ${error}` });
  }
};

//

const login = async (req, res) => {
  const { credential, password } = req.body;

  try {
    if (!credential || !password) {
      return res
        .status(400)
        .json({ error: `Credentials and password are required` });
    }

    const queryConditions = [];
    if (credential.includes("@")) {
      queryConditions.push({ email: credential });
    } else if (/^\d+$/.test(credential)) {
      queryConditions.push({ phone: credential });
    } else {
      queryConditions.push({ name: credential });
    }

    const user = await User.findOne({
      $or: queryConditions,
    });

    if (!user) return res.status(404).json({ error: `user not found` });

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched)
      return res.status(400).json({ error: `invalid credentials` });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: `login failed` });
  }
};

const sendOtp = async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 600000; //5 mins
  console.log("phone number from req.body:", phone);
  console.log("twilio SID:", process.env.TWILIO_SID);
  console.log("Twilio Phone", process.env.TWILIO_PHONE);
  console.log("Twilio Auth token", process.env.TWILIO_AUTH_TOKEN);

  try {
    await User.findOneAndUpdate(
      { phone },
      { otp, otpExpires },
      { upsert: true, new: true }
    );

    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
    res.json({ message: "OTP sent" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: `error sending otp` });
  }
};

const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  const user = await User.findOne({ phone });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(400).json({ error: `Invalid or expired OTP` });
  }

  user.verified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: `Phone verified successfully` });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailOtp = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  const otpExpires = Date.now() + 5 * 60 * 1000; //5 mins

  await User.findOneAndUpdate(
    { email },
    { otp, otpExpires },
    { upsert: true, new: true }
  );

  const appName = "AbData";
  const appEmail = "support@abdata.ng";
  const mailOptions = {
    from: `${appName} <${appEmail}>`, // Use a recognizable sender name
    to: email,
    subject: `Your OTP Code for Secure Access to ${appName}`,
    text: `Hello,\n\nYour OTP code is: ${otp}\nIt will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\n${appName} Support Team`,
  };

  await transporter.sendMail(mailOptions, (error) => {
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "OTP sent" });
  });
};

const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  user.verified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
};
