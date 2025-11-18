import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  status: {
    type: String,
    enum: ["ENROLLED", "DROPPED", "FINISHED"],
    default: "ENROLLED",
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
