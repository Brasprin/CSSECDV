// config/db.js
import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/des_audit";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Stop the app
  }
};
