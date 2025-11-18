import express from "express";
import {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  changePasswordController,
  forgotPasswordController,
  getSecurityQuestionsForForgotPasswordController,
  adminResetUserController,
  getSecurityQuestionPool,
} from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js"; // middleware to verify JWT

const router = express.Router();

// ----------------------
// PUBLIC ROUTES
// ----------------------
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh-token", refreshTokenController);
router.post("/forgot-password/get-questions", getSecurityQuestionsForForgotPasswordController);
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

// Helper
router.get("/security-questions", (req, res) => {
  res.json(getSecurityQuestionPool());
});

export default router;
