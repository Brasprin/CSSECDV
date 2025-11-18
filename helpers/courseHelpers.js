import {
  createCourseHelper,
  getTeacherCoursesHelper,
  getCourseByIdHelper,
  updateCourseHelper,
  deleteCourseHelper,
  enrollStudentHelper,
  dropStudentHelper,
} from "../helpers/courseHelpers.js";

// ----------------------
// COURSE MANAGEMENT
// ----------------------
export async function createCourseController(req, res) {
  try {
    const teacherId = req.user._id;
    const course = await createCourseHelper(req.body, teacherId);
    return res.status(201).json({ success: true, course });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function getTeacherCoursesController(req, res) {
  try {
    const courses = await getTeacherCoursesHelper(req.user._id);
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch courses" });
  }
}

export async function getCourseController(req, res) {
  try {
    const courseId = req.params.courseId;
    const course = await getCourseByIdHelper(courseId, req.user._id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch course" });
  }
}

export async function updateCourseController(req, res) {
  try {
    const courseId = req.params.courseId;
    const course = await updateCourseHelper(courseId, req.user._id, req.body);
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function deleteCourseController(req, res) {
  try {
    const courseId = req.params.courseId;
    const course = await deleteCourseHelper(courseId, req.user._id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    return res
      .status(200)
      .json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// ENROLLMENT MANAGEMENT
// ----------------------
export async function enrollStudentController(req, res) {
  try {
    const enrollment = await enrollStudentHelper(
      req.params.courseId,
      req.user._id
    );
    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function dropStudentController(req, res) {
  try {
    const enrollment = await dropStudentHelper(
      req.params.courseId,
      req.user._id
    );
    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
