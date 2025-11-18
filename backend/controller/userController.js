// controllers/userController.js
import User from "../models/User.js";
import Course from "../models/Course.js"; // optional, for teacher-student metadata

// ----------------------
// ADMIN: List all users
// ----------------------
export async function getAllUsersController(req, res) {
  try {
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, error: "Access denied: Admins only" });
    }

    const users = await User.find({}, "firstName lastName email role").lean();

    return res.status(200).json({ success: true, users, count: users.length });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch users" });
  }
}

// ----------------------
// TEACHER: Get students of a course
// ----------------------
export async function getCourseStudentsController(req, res) {
  try {
    if (req.user.role !== "TEACHER") {
      return res
        .status(403)
        .json({ success: false, error: "Access denied: Teachers only" });
    }

    const { courseId } = req.params;

    // Ensure this teacher owns the course
    const course = await Course.findOne({
      _id: courseId,
      teacherId: req.user._id,
    })
      .populate("students", "firstName lastName email") // populate student metadata
      .lean();

    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    return res.status(200).json({ success: true, students: course.students });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch students" });
  }
}
