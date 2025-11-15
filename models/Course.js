import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  section: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  capacity: { type: Number, default: 40 },

  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  status: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "OPEN",
  },

  droppingAllowed: { type: Boolean, default: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Course", courseSchema);
