import express from "express";
import {
  createCourseController,
  getTeacherCoursesController,
  getCourseController,
  updateCourseController,
  deleteCourseController,
  enrollStudentController,
  dropStudentController,
  gradeStudentController,
  getCourseGradesController,
  getStudentGradesController,
} from "../controllers/courseController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeacher } from "../middleware/requireTeacher.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = express.Router();

// ----------------------
// TEACHER COURSE MANAGEMENT (Protected)
// ----------------------
router.post("/", requireAuth, requireTeacher, createCourseController);
router.get(
  "/teacher",
  requireAuth,
  requireTeacher,
  getTeacherCoursesController
);
router.get("/:courseId", requireAuth, requireTeacher, getCourseController);
router.put("/:courseId", requireAuth, requireTeacher, updateCourseController);
router.delete(
  "/:courseId",
  requireAuth,
  requireTeacher,
  deleteCourseController
);

// ----------------------
// STUDENT ENROLLMENT (Protected)
// ----------------------
router.post(
  "/:courseId/enroll",
  requireAuth,
  requireStudent,
  enrollStudentController
);
router.delete(
  "/:courseId/drop",
  requireAuth,
  requireStudent,
  dropStudentController
);

// ----------------------
// TEACHER GRADING (Protected)
// ----------------------
router.post(
  "/:courseId/grade/:studentId",
  requireAuth,
  requireTeacher,
  gradeStudentController
);
router.get(
  "/:courseId/grades",
  requireAuth,
  requireTeacher,
  getCourseGradesController
);

// ----------------------
// STUDENT VIEW GRADES (Protected)
// ----------------------
router.get(
  "/grades/me",
  requireAuth,
  requireStudent,
  getStudentGradesController
);

export default router;
