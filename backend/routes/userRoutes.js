// routes/userRoutes.js
import express from "express";
import {
  getAllUsersController,
  getCourseStudentsController,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ----------------------
// ADMIN: List all users
// ----------------------
router.get(
  "/all",
  authMiddleware(["ADMIN"]), // Only admin can access
  getAllUsersController
);

// ----------------------
// TEACHER: Get students of a course
// ----------------------
router.get(
  "/course/:courseId/students",
  authMiddleware(["TEACHER"]), // Only teacher can access
  getCourseStudentsController
);

export default router;
