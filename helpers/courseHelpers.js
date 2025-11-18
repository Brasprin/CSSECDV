import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

const DEFAULT_CAPACITY = 40;

// ----------------------
// Validation
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

// ----------------------
// Course Management
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
  return await Course.find({ teacher: teacherId });
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
  return await Course.findOneAndDelete({
    _id: courseId,
    teacher: teacherId,
  });
}

// ----------------------
// Enrollment Management
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
    // If student had previously dropped, allow re-enroll
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

  // Instead of deleting, mark as DROPPED
  enrollment.status = "DROPPED";
  enrollment.updatedAt = new Date();
  return await enrollment.save();
}
