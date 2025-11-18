import express from "express";
import {
  gradeStudentController,
  getCourseGradesController,
  getStudentGradesController,
} from "../controllers/gradeController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeacher } from "../middleware/requireTeacher.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = express.Router();

// Teacher routes
router.post(
  "/:courseId/:studentId",
  requireAuth,
  requireTeacher,
  gradeStudentController
);
router.get(
  "/course/:courseId",
  requireAuth,
  requireTeacher,
  getCourseGradesController
);

// Student routes
router.get("/me", requireAuth, requireStudent, getStudentGradesController);

export default router;
