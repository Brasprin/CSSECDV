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
} from "../helpers/authHelpers.js";

import { auditHelper } from "../helpers/auditHelper.js";

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
    if (!validateEmail(email))
      return res.status(400).json({ success: false, error: "Invalid email" });

    // Check if email exists
    const emailCheck = await checkEmailExists(email);
    if (!emailCheck.success || emailCheck.exists)
      return res
        .status(400)
        .json({ success: false, error: "Email already registered" });

    // Password validation
    const passwordValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordValidation.success)
      return res
        .status(400)
        .json({ success: false, error: passwordValidation.error });

    // Security questions validation and hashing
    const secQValidation = await validateRegistrationSecurityQuestions(
      securityQuestions
    );
    if (!secQValidation.success)
      return res
        .status(400)
        .json({ success: false, error: secQValidation.error });

    // Create user
    const newUser = new User({
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      passwordHash: await bcrypt.hash(password, 10),
      securityQuestions: secQValidation.securityQuestions,
    });

    await newUser.save();
    return res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Registration failed" });
  }
}

// ----------------------
// LOGIN
// ----------------------
export async function loginController(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });

    const result = await handleLogin(user, password, req);
    if (!result.success)
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
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

// ----------------------
// LOGOUT
// ----------------------
export async function logoutController(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await logout(refreshToken);
    if (!result.success)
      return res.status(400).json({ success: false, error: result.error });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Logout failed" });
  }
}

// ----------------------
// CHANGE PASSWORD
// ----------------------
export async function changePasswordController(req, res) {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      securityAnswers,
      forceLogoutAllSessions,
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const result = await changePassword(
      user,
      currentPassword,
      newPassword,
      securityAnswers,
      req,
      forceLogoutAllSessions
    );
    if (!result.success)
      return res.status(400).json({ success: false, error: result.error });

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Password change failed" });
  }
}

// ----------------------
// FORGOT PASSWORD
// ----------------------
export async function forgotPasswordController(req, res) {
  try {
    const { email, newPassword, confirmPassword, securityAnswers } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const result = await validateForgotPasswordPolicy(
      user,
      newPassword,
      confirmPassword,
      securityAnswers,
      req
    );
    if (!result.success)
      return res
        .status(400)
        .json({ success: false, error: result.error, step: result.step });

    // Update password after validation, FORCE change to skip current password check
    await changePassword(
      user,
      null, // currentPassword is ignored when forceChange=true
      newPassword,
      securityAnswers,
      req,
      true, // forceLogoutAllSessions
      true // forceChange
    );

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Forgot password failed" });
  }
}

// ----------------------
// ADMIN RESET USER
// ----------------------
export async function adminResetUserController(req, res) {
  try {
    const { targetUserId, updates } = req.body;
    const adminUser = req.user; // assume req.user is already populated by auth middleware
    const result = await adminResetUser(adminUser, targetUserId, updates, req);

    if (!result.success)
      return res.status(400).json({ success: false, error: result.error });
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Admin reset failed" });
  }
}
