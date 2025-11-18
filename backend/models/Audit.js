import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },

  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: false,
    default: null,
  },

  actorRole: {
    type: String,
    enum: ["ADMIN", "TEACHER", "STUDENT"],
    default: "STUDENT",
    required: false,
  },

  action: { type: String, index: true, required: true },

  entityType: {
    type: String,
    enum: ["USER", "COURSE", "ENROLLMENT", "GRADE", "SESSION"],
    required: true,
    index: true,
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },

  metadata: { type: Object, default: {} },

  ip: String,
  userAgent: String,

  severity: {
    type: String,
    enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
    default: "INFO",
  },

  status: {
    type: String,
    enum: ["SUCCESS", "FAILURE"],
    default: "SUCCESS",
  },
});

export default mongoose.model("Audit", auditSchema);
