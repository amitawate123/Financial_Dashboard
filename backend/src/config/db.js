const mongoose = require('mongoose');

const connectDB = async (retries = 10, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      if (attempt === retries) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
      }
      console.log(`MongoDB not ready (${attempt}/${retries}), retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = connectDB;
