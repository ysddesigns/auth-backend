const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  verified: { type: Boolean, default: false },
});

module.exports = mongoose.model("Users", UserSchema);
