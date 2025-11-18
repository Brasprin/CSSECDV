import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  role: {
    type: String,
    enum: ["ADMIN", "TEACHER", "STUDENT"],
    default: "STUDENT",
  },

  passwordHash: { type: String, required: true },
  passwordChangedAt: { type: Date, default: null },
  passwordHistory: [{ type: String }],

  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  lastLoginAt: { type: Date, default: null },
  lastFailedLoginAt: { type: Date, default: null },

  securityQuestions: [{ question: String, answerHash: String }],

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
