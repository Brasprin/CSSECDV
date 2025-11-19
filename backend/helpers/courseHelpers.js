import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Grade from "../models/Grade.js";

const DEFAULT_CAPACITY = 40;
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

// ----------------------
// Validation Helpers
// ----------------------
function validateCapacity(capacity) {
  if (capacity == null) return DEFAULT_CAPACITY;
  if (
    typeof capacity !== "number" ||
    !Number.isInteger(capacity) ||
    capacity < 0
  ) {
    throw new Error("Capacity must be a non-negative integer");
  }
  return capacity;
}

function validateGrade(value) {
  if (!VALID_GRADES.includes(value)) {
    throw new Error(`Invalid grade value. Allowed: ${VALID_GRADES.join(", ")}`);
  }
  return value;
}

// ----------------------
// COURSE MANAGEMENT
// ----------------------
export async function createCourseHelper(courseData, teacherId) {
  const { code, section, title, description, capacity } = courseData;
  const validatedCapacity = validateCapacity(capacity);

  const newCourse = new Course({
    code,
    section,
    title,
    description,
    capacity: validatedCapacity,
    teacher: teacherId,
    createdBy: teacherId,
  });

  await newCourse.save();
  return newCourse;
}

export async function getTeacherCoursesHelper(teacherId) {
  const courses = await Course.find({ teacher: teacherId });
  
  // Fetch enrollment count for each course
  const coursesWithEnrollment = await Promise.all(
    courses.map(async (course) => {
      const enrolledCount = await Enrollment.countDocuments({
        courseId: course._id,
        status: "ENROLLED",
      });
      return {
        ...course.toObject(),
        enrolledCount,
      };
    })
  );
  
  return coursesWithEnrollment;
}

export async function getCourseByIdHelper(courseId, teacherId) {
  return await Course.findOne({ _id: courseId, teacher: teacherId });
}

export async function updateCourseHelper(courseId, teacherId, updates) {
  const course = await Course.findOne({ _id: courseId, teacher: teacherId });
  if (!course) return null;

  if (updates.capacity !== undefined)
    course.capacity = validateCapacity(updates.capacity);
  if (updates.title) course.title = updates.title;
  if (updates.section) course.section = updates.section;
  if (updates.description) course.description = updates.description;
  if (updates.status) course.status = updates.status;
  if (updates.droppingAllowed !== undefined)
    course.droppingAllowed = updates.droppingAllowed;

  course.updatedAt = new Date();
  await course.save();
  return course;
}

export async function deleteCourseHelper(courseId, teacherId) {
  return await Course.findOneAndDelete({ _id: courseId, teacher: teacherId });
}

// ----------------------
// ENROLLMENT MANAGEMENT
// ----------------------
export async function enrollStudentHelper(courseId, studentId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.status === "CLOSED")
    throw new Error("Cannot enroll: course is closed");

  const enrolledCount = await Enrollment.countDocuments({
    courseId,
    status: "ENROLLED",
  });
  if (enrolledCount >= course.capacity)
    throw new Error("Cannot enroll: course is full");

  const existingEnrollment = await Enrollment.findOne({
    courseId,
    student: studentId,
  });
  if (existingEnrollment) {
    if (existingEnrollment.status === "DROPPED") {
      existingEnrollment.status = "ENROLLED";
      existingEnrollment.updatedAt = new Date();
      return await existingEnrollment.save();
    }
    throw new Error("Cannot enroll: student already enrolled");
  }

  return await Enrollment.create({ courseId, student: studentId });
}

export async function dropStudentHelper(courseId, studentId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (!course.droppingAllowed)
    throw new Error("Cannot drop: dropping is not allowed for this course");

  const enrollment = await Enrollment.findOne({ courseId, student: studentId });
  if (!enrollment)
    throw new Error("Cannot drop: student not enrolled in this course");

  enrollment.status = "DROPPED";
  enrollment.updatedAt = new Date();
  return await enrollment.save();
}

export async function finishEnrollmentHelper(courseId, studentId) {
  const enrollment = await Enrollment.findOne({ courseId, student: studentId });
  if (!enrollment) throw new Error("Student not enrolled in this course");
  if (enrollment.status !== "ENROLLED") {
    throw new Error(`Cannot finish: student status is ${enrollment.status}`);
  }

  enrollment.status = "FINISHED";
  enrollment.updatedAt = new Date();
  return await enrollment.save();
}

// ----------------------
// GRADING MANAGEMENT
// ----------------------
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

export async function getCourseGradesHelper(courseId, teacherId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== teacherId.toString()) {
    throw new Error("Unauthorized: Only the course teacher can view grades");
  }
  return await Grade.find({ courseId });
}

export async function getStudentGradesHelper(studentId) {
  return await Grade.find({ studentId });
}

// ----------------------
// STUDENT ENROLLMENT RETRIEVAL
// ----------------------
export async function getCourseEnrolledStudentsHelper(courseId, teacherId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== teacherId.toString()) {
    throw new Error("Unauthorized: Only the course teacher can view enrollments");
  }

  const enrollments = await Enrollment.find({
    courseId,
    status: "ENROLLED",
  }).populate("student", "email firstName lastName");

  return enrollments.map((enrollment) => ({
    enrollmentId: enrollment._id,
    studentId: enrollment.student._id,
    email: enrollment.student.email,
    firstName: enrollment.student.firstName,
    lastName: enrollment.student.lastName,
    enrolledAt: enrollment.createdAt,
  }));
}

// ----------------------
// TEACHER REMOVE STUDENT FROM COURSE
// ----------------------
export async function removeStudentFromCourseHelper(courseId, studentId, teacherId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== teacherId.toString()) {
    throw new Error("Unauthorized: Only the course teacher can remove students");
  }

  const enrollment = await Enrollment.findOne({ courseId, student: studentId });
  if (!enrollment) throw new Error("Student not enrolled in this course");

  enrollment.status = "DROPPED";
  enrollment.updatedAt = new Date();
  return await enrollment.save();
}
