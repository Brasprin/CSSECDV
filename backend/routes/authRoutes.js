import express from "express";
import {
  register,
  login,
  refreshTokenController,
  logoutController,
  changePasswordController,
  forgotPasswordController,
  adminResetUserController,
} from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js"; // middleware to verify JWT

const router = express.Router();

// ----------------------
// PUBLIC ROUTES
// ----------------------
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshTokenController);
router.post("/forgot-password", forgotPasswordController);

// ----------------------
// PROTECTED ROUTES (JWT required)
// ----------------------
router.post("/logout", authenticateJWT, logoutController);
router.post("/change-password", authenticateJWT, changePasswordController);

// ----------------------
// ADMIN ROUTES (JWT + admin check required)
// ----------------------
router.post("/admin/reset-user", authenticateJWT, adminResetUserController);

export default router;
