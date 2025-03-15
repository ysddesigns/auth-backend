const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log(`connected to MongoDB successfully!`);
  } catch (error) {
    console.log(`error connecting to mongoDB ${error}`);
  }
};
connectDB();

module.exports = mongoose;
