import express from "express";
import {
  gradeStudentController,
  getGradesForCourseController,
  getStudentGradeController,
} from "../controllers/gradeController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeacher } from "../middleware/requireTeacher.js";

const router = express.Router();

// Only teacher that owns the course can grade
router.post(
  "/:courseId/student/:studentId",
  requireAuth,
  requireTeacher,
  gradeStudentController
);

// Only teacher that owns the course can see all grades
router.get(
  "/:courseId",
  requireAuth,
  requireTeacher,
  getGradesForCourseController
);

// Optional: anyone (teacher/student) can see a student's grade
router.get(
  "/:courseId/student/:studentId",
  requireAuth,
  getStudentGradeController
);

export default router;
