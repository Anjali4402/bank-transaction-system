const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("Database connected successfully!");
  } catch (error) {
    console.log("Database connection Failed");

    // close the project because without database there is no mean of any project.
    process.exit(1);
  }
}

module.exports = connectDB;
