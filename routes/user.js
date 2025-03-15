// routes/user
const express = require("express");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: `This is protected routes`, user: req.user });
});

module.exports = router;
