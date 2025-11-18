import {
  gradeStudentHelper,
  getCourseGradesHelper,
  getStudentGradesHelper,
} from "../helpers/gradeHelpers.js";

// ----------------------
// Teacher grades a student
// ----------------------
export async function gradeStudentController(req, res) {
  try {
    const { courseId, studentId } = req.params;
    const teacherId = req.user._id;
    const { value } = req.body;

    const grade = await gradeStudentHelper(
      courseId,
      studentId,
      value,
      teacherId
    );

    return res.status(200).json({
      success: true,
      message: "Student graded successfully",
      grade,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// Teacher views all grades for their course
// ----------------------
export async function getCourseGradesController(req, res) {
  try {
    const teacherId = req.user._id;
    const { courseId } = req.params;

    const grades = await getCourseGradesHelper(courseId, teacherId);
    return res.status(200).json({ success: true, grades });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// Student views their own grades
// ----------------------
export async function getStudentGradesController(req, res) {
  try {
    const studentId = req.user._id;

    const grades = await getStudentGradesHelper(studentId);
    return res.status(200).json({ success: true, grades });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
