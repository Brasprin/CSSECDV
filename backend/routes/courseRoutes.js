import express from "express";
import {
  createCourseController,
  getTeacherCoursesController,
  getCourseByIdController,
  updateCourseController,
  deleteCourseController,
  enrollStudentController,
  dropStudentController,
  gradeStudentController,
  getCourseGradesController,
  getStudentGradesController,
  getCourseEnrolledStudentsController,
  removeStudentFromCourseController,
} from "../controllers/courseController.js";

import { authenticateJWT } from "../middleware/authMiddleware.js";
import { requireTeacher } from "../middleware/requireTeacher.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = express.Router();

// ----------------------
// TEACHER COURSE MANAGEMENT (Protected)
// ----------------------
router.post("/", authenticateJWT, requireTeacher, createCourseController);
router.get(
  "/teacher",
  authenticateJWT,
  requireTeacher,
  getTeacherCoursesController
);

// ----------------------
// STUDENT VIEW GRADES (Protected)
// ----------------------
router.get(
  "/grades/me",
  authenticateJWT,
  requireStudent,
  getStudentGradesController
);

// ----------------------
// STUDENT ENROLLMENT (Protected)
// ----------------------
router.post(
  "/:courseId/enroll",
  authenticateJWT,
  requireStudent,
  enrollStudentController
);
router.delete(
  "/:courseId/drop",
  authenticateJWT,
  requireStudent,
  dropStudentController
);

// ----------------------
// TEACHER GRADING (Protected)
// ----------------------
router.get(
  "/:courseId/grades",
  authenticateJWT,
  requireTeacher,
  getCourseGradesController
);
router.post(
  "/:courseId/grade/:studentId",
  authenticateJWT,
  requireTeacher,
  gradeStudentController
);

// ----------------------
// TEACHER VIEW ENROLLED STUDENTS (Protected)
// ----------------------
router.get(
  "/:courseId/students",
  authenticateJWT,
  requireTeacher,
  getCourseEnrolledStudentsController
);
router.delete(
  "/:courseId/students/:studentId",
  authenticateJWT,
  requireTeacher,
  removeStudentFromCourseController
);

// ----------------------
// GENERIC COURSE ROUTES (Protected) - MUST BE LAST
// ----------------------
router.get(
  "/:courseId",
  authenticateJWT,
  requireTeacher,
  getCourseByIdController
);
router.put(
  "/:courseId",
  authenticateJWT,
  requireTeacher,
  updateCourseController
);
router.delete(
  "/:courseId",
  authenticateJWT,
  requireTeacher,
  deleteCourseController
);
export default router;
