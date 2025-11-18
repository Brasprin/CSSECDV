import express from "express";
import {
  createCourseController,
  getTeacherCoursesController,
  getCourseController,
  updateCourseController,
  deleteCourseController,
  enrollStudentController,
  dropStudentController,
} from "../controllers/courseController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeacher } from "../middleware/requireTeacher.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = express.Router();

// ----------------------
// Teacher routes (protected)
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
// Student routes (protected)
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

export default router;
