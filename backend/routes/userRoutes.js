// routes/userRoutes.js
import express from "express";
import {
  getAllUsersController,
  getCourseStudentsController,
} from "../controllers/userController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireTeacher } from "../middleware/requireTeacher.js";

const router = express.Router();

// ----------------------
// ADMIN: List all users
// ----------------------
router.get("/all", authenticateJWT, requireAdmin, getAllUsersController);

// ----------------------
// TEACHER: Get students of a course
// ----------------------
router.get(
  "/course/:courseId/students",
  authenticateJWT,
  requireTeacher,
  getCourseStudentsController
);

export default router;
