import Grade from "../models/Grade.js";
import Course from "../models/Course.js";
import { finishEnrollmentHelper } from "./courseHelpers.js";

const VALID_GRADES = [
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

function validateGrade(value) {
  if (!VALID_GRADES.includes(value)) {
    throw new Error(`Invalid grade value. Allowed: ${VALID_GRADES.join(", ")}`);
  }
  return value;
}

export async function finishEnrollmentHelper(courseId, studentId) {
  const enrollment = await Enrollment.findOne({ courseId, student: studentId });
  if (!enrollment) throw new Error("Student not enrolled in this course");

  // Only allow finishing if student is currently ENROLLED
  if (enrollment.status !== "ENROLLED") {
    throw new Error(`Cannot finish: student status is ${enrollment.status}`);
  }

  enrollment.status = "FINISHED";
  enrollment.updatedAt = new Date();
  return await enrollment.save();
}

export async function gradeStudentHelper(
  courseId,
  studentId,
  gradeValue,
  teacherId
) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== teacherId.toString()) {
    throw new Error("Unauthorized: Only the course teacher can grade");
  }

  validateGrade(gradeValue);

  let grade = await Grade.findOne({ courseId, studentId });
  if (grade) {
    grade.value = gradeValue;
    grade.gradedBy = teacherId;
    grade.version += 1;
    grade.updatedAt = new Date();
  } else {
    grade = new Grade({
      courseId,
      studentId,
      value: gradeValue,
      gradedBy: teacherId,
    });
  }

  await grade.save();

  // Mark enrollment FINISHED
  await finishEnrollmentHelper(courseId, studentId);

  return grade;
}
