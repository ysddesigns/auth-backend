require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./config/db");
const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(cors());

// default routes
app.get("/", (req, res) => {
  res.send("Welcome to Yusuff Backend");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));

// app.use("", routes)

// Global error handlw middleware
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ error: `Something went wrong!` });
});

app.listen(PORT, () => {
  console.log("Server listening to PORT", PORT);
});
