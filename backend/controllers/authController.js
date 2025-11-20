import bcrypt from "bcrypt";
import User from "../models/User.js";
import {
  validateEmail,
  checkEmailExists,
  validatePasswordMatch,
  handleLogin,
  refreshTokens,
  logout,
  changePassword,
  validateForgotPasswordPolicy,
  validateRegistrationSecurityQuestions,
  adminResetUser,
  SECURITY_QUESTION_POOL,
} from "../helpers/authHelpers.js";

import { auditHelper } from "../helpers/auditHelpers.js";

export function getSecurityQuestionPool() {
  return SECURITY_QUESTION_POOL;
}

// ----------------------
// REGISTER
// ----------------------
export async function registerController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const {
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      securityQuestions,
    } = req.body;

    // Email validation
    if (!validateEmail(email)) {
      await auditHelper({
        req,
        action: "REGISTER_FAILED_INVALID_EMAIL",
        entityType: "USER",
        metadata: { email, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res.status(400).json({ success: false, error: "Invalid email" });
    }

    // Check if email exists
    const emailCheck = await checkEmailExists(email);
    if (!emailCheck.success || emailCheck.exists) {
      await auditHelper({
        req,
        action: "REGISTER_FAILED_EMAIL_EXISTS",
        entityType: "USER",
        metadata: { email, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(400)
        .json({ success: false, error: "Email already registered" });
    }

    // Password validation
    const passwordValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordValidation.success) {
      await auditHelper({
        req,
        action: "REGISTER_FAILED_PASSWORD_MISMATCH",
        entityType: "USER",
        metadata: { email, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(400)
        .json({ success: false, error: passwordValidation.error });
    }

    // Security questions validation and hashing
    const secQValidation = await validateRegistrationSecurityQuestions(
      securityQuestions
    );
    if (!secQValidation.success) {
      await auditHelper({
        req,
        action: "REGISTER_FAILED_INVALID_SECURITY_QUESTIONS",
        entityType: "USER",
        metadata: { email, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(400)
        .json({ success: false, error: secQValidation.error });
    }

    // Create user
    const newUser = new User({
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      passwordHash: await bcrypt.hash(password, 10),
      securityQuestions: secQValidation.securityQuestions,
    });

    await newUser.save();

    // Log successful registration
    await auditHelper({
      req,
      action: "REGISTER_SUCCESS",
      entityType: "USER",
      entityId: newUser._id,
      metadata: { email, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(error);

    await auditHelper({
      req,
      action: "REGISTER_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Registration failed" });
  }
}

// ----------------------
// LOGIN
// ----------------------
export async function loginController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Log failed login (invalid email)
      await auditHelper({
        req,
        action: "LOGIN_FAILED_INVALID_EMAIL",
        entityType: "USER",
        metadata: { email: normalizedEmail, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const result = await handleLogin(user, password, req);

    if (!result.success) {
      // Log failed login (wrong password)
      await auditHelper({
        req,
        action: "LOGIN_FAILED_WRONG_PASSWORD",
        entityType: "USER",
        entityId: user._id,
        metadata: { email: normalizedEmail, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    // Log successful login
    await auditHelper({
      req,
      action: "LOGIN_SUCCESS",
      entityType: "USER",
      entityId: user._id,
      metadata: { email: normalizedEmail, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    // Log unexpected server error
    await auditHelper({
      req,
      action: "LOGIN_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res.status(500).json({ success: false, error: "Login failed" });
  }
}
// ----------------------
// REFRESH TOKEN
// ----------------------
export async function refreshTokenController(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await refreshTokens(refreshToken, req);
    if (!result.success)
      return res.status(401).json({ success: false, error: result.error });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Token refresh failed" });
  }
}

export async function logoutController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const { refreshToken } = req.body;
    const result = await logout(refreshToken);

    if (!result.success) {
      // Log failed logout
      await auditHelper({
        req,
        action: "LOGOUT_FAILED",
        entityType: "SESSION",
        metadata: { refreshToken, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res.status(400).json({ success: false, error: result.error });
    }

    // Log successful logout
    await auditHelper({
      req,
      action: "LOGOUT_SUCCESS",
      entityType: "SESSION",
      metadata: { ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(error);

    // Log unexpected server error
    await auditHelper({
      req,
      action: "LOGOUT_FAILED_SERVER_ERROR",
      entityType: "SESSION",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res.status(500).json({ success: false, error: "Logout failed" });
  }
}

// ----------------------
// CHANGE PASSWORD
// ----------------------
export async function changePasswordController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      securityAnswers,
      forceLogoutAllSessions,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      // Log failed password change
      await auditHelper({
        req,
        action: "CHANGE_PASSWORD_FAILED_USER_NOT_FOUND",
        entityType: "USER",
        metadata: { userId: req.user.id, ip, userAgent },
        severity: "ERROR",
        status: "FAILURE",
      });

      return res.status(404).json({ success: false, error: "User not found" });
    }

    const result = await changePassword(
      user,
      currentPassword,
      newPassword,
      securityAnswers,
      req,
      forceLogoutAllSessions
    );

    if (!result.success) {
      // Log failed password change
      await auditHelper({
        req,
        action: "CHANGE_PASSWORD_FAILED",
        entityType: "USER",
        entityId: user._id,
        metadata: { error: result.error, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res.status(400).json({ success: false, error: result.error });
    }

    // Log successful password change
    await auditHelper({
      req,
      action: "CHANGE_PASSWORD_SUCCESS",
      entityType: "USER",
      entityId: user._id,
      metadata: { ip, userAgent, forceLogoutAllSessions },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);

    // Log unexpected server error
    await auditHelper({
      req,
      action: "CHANGE_PASSWORD_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Password change failed" });
  }
}

// ----------------------
// GET SECURITY QUESTIONS FOR FORGOT PASSWORD
// ----------------------
export async function getSecurityQuestionsForForgotPasswordController(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Return only the questions (not the hashes)
    const securityQuestions = user.securityQuestions.map((sq) => ({
      question: sq.question,
    }));

    return res.status(200).json({
      success: true,
      securityQuestions,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to retrieve security questions" });
  }
}

// ----------------------
// FORGOT PASSWORD
// ----------------------
export async function forgotPasswordController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const { email, newPassword, confirmPassword, securityAnswers } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Log failed forgot password attempt
      await auditHelper({
        req,
        action: "FORGOT_PASSWORD_FAILED_USER_NOT_FOUND",
        entityType: "USER",
        metadata: { email, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const result = await validateForgotPasswordPolicy(
      user,
      newPassword,
      confirmPassword,
      securityAnswers,
      req
    );

    if (!result.success) {
      // Log failed policy validation
      await auditHelper({
        req,
        action: "FORGOT_PASSWORD_FAILED_POLICY",
        entityType: "USER",
        entityId: user._id,
        metadata: { error: result.error, step: result.step, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res
        .status(400)
        .json({ success: false, error: result.error, step: result.step });
    }

    // Update password (forceChange)
    await changePassword(
      user,
      null, // currentPassword ignored
      newPassword,
      securityAnswers,
      req,
      true, // forceLogoutAllSessions
      true // forceChange
    );

    // Log successful password reset
    await auditHelper({
      req,
      action: "FORGOT_PASSWORD_SUCCESS",
      entityType: "USER",
      entityId: user._id,
      metadata: { ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);

    // Log unexpected server error
    await auditHelper({
      req,
      action: "FORGOT_PASSWORD_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Forgot password failed" });
  }
}

// ----------------------
// ADMIN RESET USER
// ----------------------
export async function adminResetUserController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const { targetUserId, updates } = req.body;
    const adminUser = req.user;

    const result = await adminResetUser(adminUser, targetUserId, updates, req);

    if (!result.success) {
      // Log failed admin reset
      await auditHelper({
        req,
        action: "ADMIN_RESET_USER_FAILED",
        entityType: "USER",
        entityId: targetUserId,
        metadata: {
          error: result.error,
          ip,
          userAgent,
          adminId: adminUser._id,
        },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res.status(400).json({ success: false, error: result.error });
    }

    // Log successful admin reset
    await auditHelper({
      req,
      action: "ADMIN_RESET_USER_SUCCESS",
      entityType: "USER",
      entityId: targetUserId,
      metadata: { ip, userAgent, adminId: adminUser._id, updates },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    // Log unexpected server error
    await auditHelper({
      req,
      action: "ADMIN_RESET_USER_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent, adminId: req.user._id },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Admin reset failed" });
  }
}
