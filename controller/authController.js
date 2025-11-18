import bcrypt from "bcrypt";
import User from "../models/User.js";
import {
  validateEmail,
  validatePasswordMatch,
  handleLogin,
  refreshTokens,
  logout,
  changePassword,
  validateForgotPasswordPolicy,
  getSecurityQuestionPool,
  validateRegistrationSecurityQuestions,
  checkEmailExists,
  adminResetUser,
} from "../helpers/auth.js";

const Session = require("../models/Session.js").default;

export async function checkEmailAvailability(req, res) {
  const { email } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const result = await checkEmailExists(email);

  if (!result.success) {
    const statusCode = result.exists ? 409 : 400;
    return res.status(statusCode).json({
      success: false,
      exists: result.exists || false,
      error: result.error,
    });
  }

  res.json({
    success: true,
    exists: false,
    message: result.message,
  });
}

// Register function
export async function register(req, res) {
  const {
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    securityQuestionsAnswers,
  } = req.body || {};

  // Normalize inputs
  const normalizedEmail = (email || "").toLowerCase().trim();
  const trimmedFirstName = (firstName || "").trim();
  const trimmedLastName = (lastName || "").trim();

  // Validate email format
  if (!validateEmail(normalizedEmail)) {
    return res
      .status(400)
      .json({ field: "email", message: "Invalid email format" });
  }

  // Check if email already exists
  const emailCheckResult = await checkEmailExists(normalizedEmail);
  if (!emailCheckResult.success) {
    return res
      .status(409)
      .json({ field: "email", message: emailCheckResult.error });
  }

  // Validate password and confirm password match
  const passwordValidation = validatePasswordMatch(password, confirmPassword);
  if (!passwordValidation.success) {
    return res
      .status(400)
      .json({ field: "password", message: passwordValidation.error });
  }

  // Validate first name
  if (!trimmedFirstName || trimmedFirstName.length < 2) {
    return res.status(400).json({
      field: "firstName",
      message: "First name must be at least 2 characters",
    });
  }

  // Validate last name
  if (!trimmedLastName || trimmedLastName.length < 2) {
    return res.status(400).json({
      field: "lastName",
      message: "Last name must be at least 2 characters",
    });
  }

  // Validate and hash security questions
  const securityQuestionsValidation =
    await validateRegistrationSecurityQuestions(securityQuestionsAnswers);
  if (!securityQuestionsValidation.success) {
    return res.status(400).json({
      field: "securityQuestions",
      message: securityQuestionsValidation.error,
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizedEmail,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      passwordHash,
      securityQuestions: securityQuestionsValidation.securityQuestions,
      role: "STUDENT",
    });

    res.status(201).json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ field: "email", message: "Email already registered" });
    res.status(500).json({ message: "Registration failed" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Generic invalid response
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const result = await handleLogin(user, password, req);

  if (!result.success) {
    return res.status(401).json({
      error: "invalid credentials",
      ...("attemptsRemaining" in result && {
        attemptsRemaining: result.attemptsRemaining,
      }),
      ...("lockout" in result && { lockout: result.lockout }),
    });
  }

  // Set refresh token cookie
  res.cookie("refresh_token", result.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: result.accessToken,
    user: result.user,
    lastLoginAt: result.lastLoginAt,
    lastFailedLoginAt: result.lastFailedLoginAt,
  });
}

export async function refresh(req, res) {
  const oldRefreshToken = req.cookies.refresh_token;
  if (!oldRefreshToken)
    return res.status(401).json({ error: "No refresh token provided" });

  const result = await refreshTokens(oldRefreshToken, req);

  if (!result.success) return res.status(401).json({ error: result.error });

  // Set new refresh token cookie
  res.cookie("refresh_token", result.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: result.accessToken,
    userId: result.userId,
  });
}

export async function logoutController(req, res) {
  const refreshToken = req.cookies.refresh_token;
  const result = await logout(refreshToken);

  // Clear cookie
  res.clearCookie("refresh_token", { path: "/" });

  if (!result.success) return res.status(400).json({ error: result.error });

  res.json({ message: "Logged out successfully" });
}

export async function changePasswordController(req, res) {
  const {
    currentPassword,
    newPassword,
    confirmPassword,
    forceLogoutAllSessions,
  } = req.body;
  const user = req.user; // assume requireAuth middleware sets req.user

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password required" });
  }

  // Validate new password and confirm password match
  const passwordValidation = validatePasswordMatch(
    newPassword,
    confirmPassword
  );
  if (!passwordValidation.success) {
    return res.status(400).json({ error: passwordValidation.error });
  }

  const result = await changePassword(
    user,
    currentPassword,
    newPassword,
    req,
    forceLogoutAllSessions
  );

  if (!result.success) {
    return res.status(409).json(result);
  }

  res.json({ message: "Password changed successfully" });
}

export async function getSecurityQuestions(req, res) {
  try {
    const questions = getSecurityQuestionPool();
    res.json({
      success: true,
      questions: questions.map((q, index) => ({
        index,
        question: q,
      })),
      required: REQUIRED_SECURITY_QUESTIONS, // use the constant here
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve security questions" });
  }
}

export async function forgotPasswordReset(req, res) {
  const { email, newPassword, confirmPassword, securityAnswers } =
    req.body || {};

  // Validate inputs
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({ error: "New password and confirm password are required" });
  }

  if (!Array.isArray(securityAnswers) || securityAnswers.length === 0) {
    return res.status(400).json({ error: "Security answers are required" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Generic response for security (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message:
          "If email exists and all validations pass, password will be reset",
      });
    }

    // Apply forgot password policy validation (includes security question validation)
    const policyResult = await validateForgotPasswordPolicy(
      user,
      newPassword,
      confirmPassword,
      securityAnswers,
      req
    );

    if (!policyResult.success) {
      // Return appropriate status based on validation step
      let statusCode = 400;
      if (policyResult.step === "security_answers") {
        statusCode = 401;
      } else if (policyResult.step === "password_history") {
        statusCode = 409;
      }

      return res.status(statusCode).json({
        success: false,
        error: policyResult.error,
        step: policyResult.step,
      });
    }

    // All validations passed - update password
    const now = new Date();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Rotate password history (keep last 2)
    user.passwordHistory = [
      user.passwordHash,
      ...(user.passwordHistory || []),
    ].slice(0, 2);

    // Update password
    user.passwordHash = passwordHash;
    user.passwordChangedAt = now;
    await user.save();

    // Revoke all sessions (user must login again)
    const sessions = await Session.find({ userId: user._id, revokedAt: null });
    const nowTs = new Date();
    for (const s of sessions) {
      s.revokedAt = nowTs;
      await s.save();
    }

    return res.json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Forgot password reset error:", error);
    return res.status(500).json({ error: "Password reset failed" });
  }
}

// Admin Functions
export async function adminResetUserController(req, res) {
  try {
    const adminUser = req.user;
    const {
      targetUserId,
      newPassword,
      confirmPassword,
      newSecurityQuestionsAnswers,
    } = req.body;

    const result = await adminResetUser(
      adminUser,
      targetUserId,
      {
        newPassword,
        confirmPassword,
        newSecurityQuestionsAnswers,
      },
      req
    );

    if (!result.success) return res.status(400).json(result);

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
