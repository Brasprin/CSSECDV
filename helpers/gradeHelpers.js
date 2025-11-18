import Grade from "../models/Grade.js";
import Enrollment from "../models/Enrollment.js";

// Allowed grade values
const ALLOWED_GRADES = [
  "4.0",
  "3.5",
  "3.0",
  "2.5",
  "2.0",
  "1.5",
  "1.0",
  "0.0",
  "W",
];

// ----------------------
// Validation
// ----------------------
function validateGrade(value) {
  if (!ALLOWED_GRADES.includes(value)) {
    throw new Error("Invalid grade value");
  }
  return value;
}

// ----------------------
// Grade Management
// ----------------------
export async function gradeStudentHelper(
  courseId,
  studentId,
  teacherId,
  value
) {
  const validatedValue = validateGrade(value);

  // Ensure the teacher owns the course
  const course = await Enrollment.model("Course").findById(courseId);
  if (!course) throw new Error("Course not found");
  if (!course.teacher.equals(teacherId))
    throw new Error("Unauthorized: not course owner");

  // Ensure the student is enrolled
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: studentId,
  });
  if (!enrollment) throw new Error("Student not enrolled in this course");

  // Upsert grade (create new or update existing)
  const grade = await Grade.findOneAndUpdate(
    { courseId, studentId },
    {
      value: validatedValue,
      gradedBy: teacherId,
      updatedAt: new Date(),
      $inc: { version: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Update enrollment status to FINISHED
  enrollment.status = "FINISHED";
  enrollment.updatedAt = new Date();
  await enrollment.save();

  return grade;
}

export async function getGradesForCourseHelper(courseId, teacherId) {
  const course = await Enrollment.model("Course").findById(courseId);
  if (!course) throw new Error("Course not found");
  if (!course.teacher.equals(teacherId))
    throw new Error("Unauthorized: not course owner");

  return await Grade.find({ courseId }).populate(
    "studentId",
    "firstName lastName"
  );
}

export async function getStudentGradeHelper(courseId, studentId) {
  return await Grade.findOne({ courseId, studentId });
}
