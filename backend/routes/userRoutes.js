// routes/userRoutes.js
import express from "express";
import {
  getAllUsersController,
  getCourseStudentsController,
} from "../controllers/userController.js";
import { authenticateJWT, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ----------------------
// ADMIN: List all users
// ----------------------
router.get(
  "/all",
  authenticateJWT,
  requireRole("ADMIN"),
  getAllUsersController
);

// ----------------------
// TEACHER: Get students of a course
// ----------------------
router.get(
  "/course/:courseId/students",
  authenticateJWT,
  requireRole("TEACHER"),
  getCourseStudentsController
);

export default router;
