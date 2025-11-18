import express from "express";
import {
  register,
  login,
  refresh,
  logoutController,
  changePasswordController,
  forgotPasswordReset,
  getSecurityQuestions,
  checkEmailAvailability,
  adminResetUserController,
} from "../controllers/authController.js";

import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ----------------------
// Public Auth Endpoints
// ----------------------
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logoutController);
router.post("/change-password", requireAuth, changePasswordController);
router.post("/check-email", checkEmailAvailability);
router.get("/security-questions", getSecurityQuestions);
router.post("/forgot-password/reset", forgotPasswordReset);

// ----------------------
// Admin-Only Endpoints
// ----------------------
router.post(
  "/admin/reset-user",
  requireAuth,
  requireRole("ADMIN"),
  adminResetUserController
);

export default router;
