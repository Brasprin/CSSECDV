import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  value: {
    type: String,
    enum: ["4.0", "3.5", "3.0", "2.5", "2.0", "1.5", "1.0", "0.0", "W"],
    required: true,
  },

  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  version: { type: Number, default: 1 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// prevent duplicate grades per student/course
gradeSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Grade", gradeSchema);
