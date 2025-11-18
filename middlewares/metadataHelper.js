// helpers/metadataHelper.js
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Grade from "../models/Grade.js";

export async function getUserMetadata(userId) {
  if (!userId) return null;

  const user = await User.findById(userId).select(
    "firstName lastName email role"
  );
  if (!user) return null;

  return {
    id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
  };
}

export async function getCourseMetadata(courseId) {
  if (!courseId) return null;

  const course = await Course.findById(courseId).populate(
    "teacher",
    "firstName lastName email"
  );
  if (!course) return null;

  return {
    id: course._id,
    title: course.title,
    code: course.code || course._id.toString(),
    teacher: course.teacher
      ? {
          name: `${course.teacher.firstName} ${course.teacher.lastName}`,
          email: course.teacher.email,
        }
      : null,
  };
}

export async function getEnrollmentMetadata(enrollmentId) {
  if (!enrollmentId) return null;

  const enrollment = await Enrollment.findById(enrollmentId)
    .populate("student", "firstName lastName email")
    .populate("course", "title code");

  if (!enrollment) return null;

  return {
    id: enrollment._id,
    student: enrollment.student
      ? {
          name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          email: enrollment.student.email,
        }
      : null,
    course: enrollment.course
      ? {
          title: enrollment.course.title,
          code: enrollment.course.code || enrollment.course._id.toString(),
        }
      : null,
  };
}

export async function getGradeMetadata(gradeId) {
  if (!gradeId) return null;

  const grade = await Grade.findById(gradeId)
    .populate("student", "firstName lastName email")
    .populate("course", "title code");

  if (!grade) return null;

  return {
    id: grade._id,
    value: grade.value,
    student: grade.student
      ? {
          name: `${grade.student.firstName} ${grade.student.lastName}`,
          email: grade.student.email,
        }
      : null,
    course: grade.course
      ? {
          title: grade.course.title,
          code: grade.course.code || grade.course._id.toString(),
        }
      : null,
  };
}
