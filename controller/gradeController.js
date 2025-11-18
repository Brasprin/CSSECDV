import {
  gradeStudentHelper,
  getGradesForCourseHelper,
  getStudentGradeHelper,
} from "../helpers/gradeHelpers.js";

// ----------------------
// Assign / Update Grade
// ----------------------
export async function gradeStudentController(req, res) {
  try {
    const { courseId, studentId } = req.params;
    const { value } = req.body;
    const teacherId = req.user._id;

    const grade = await gradeStudentHelper(
      courseId,
      studentId,
      teacherId,
      value
    );
    return res.status(200).json({ success: true, grade });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// Retrieve all grades in a course (teacher only)
// ----------------------
export async function getGradesForCourseController(req, res) {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id;

    const grades = await getGradesForCourseHelper(courseId, teacherId);
    return res.status(200).json({ success: true, grades });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// Retrieve single student grade (student or teacher)
// ----------------------
export async function getStudentGradeController(req, res) {
  try {
    const { courseId, studentId } = req.params;

    const grade = await getStudentGradeHelper(courseId, studentId);
    if (!grade)
      return res.status(404).json({ success: false, error: "Grade not found" });

    return res.status(200).json({ success: true, grade });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
