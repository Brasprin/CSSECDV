import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  refreshTokenHash: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },

  ip: String,
  userAgent: String,
});

export default mongoose.model("Session", sessionSchema);
