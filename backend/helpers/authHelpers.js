import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 10 * 60 * 1000; // 10 min
const MIN_PASSWORD_AGE = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const PASSWORD_HISTORY_LIMIT = 2;
const REQUIRED_SECURITY_QUESTIONS = 3;
const MIN_SECURITY_ANSWER_LENGTH = 3;

export const SECURITY_QUESTION_POOL = [
  "What is the name of your first pet?",
  "What is your mother's maiden name?",
  "What street did you grow up on?",
  "What is the name of your first nephew or niece?",
  "What was the model of your first car?",
  "What city were you born in?",
  "What was the first concert you attended?",
  "What is the name of your first best friend from childhood?",
];

// ----------------------
// Email & Password Utils
// ----------------------
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export async function checkEmailExists(email) {
  try {
    const exists = await User.exists({ email: email.toLowerCase().trim() });
    return { success: true, exists };
  } catch (error) {
    return { success: false, error: "Failed to check email availability" };
  }
}

export function validatePasswordMatch(password, confirmPassword) {
  if (!password || password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }
  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long",
    };
  }
  return { success: true };
}

export async function checkPasswordHistory(newPassword, user) {
  const recentPasswords = [
    user.passwordHash,
    ...(user.passwordHistory || []),
  ].slice(0, PASSWORD_HISTORY_LIMIT);

  for (const hash of recentPasswords) {
    if (await bcrypt.compare(newPassword, hash)) {
      return {
        success: false,
        error: "New password cannot be the same as the last 2 passwords",
      };
    }
  }
  return { success: true };
}

// ----------------------
// Security Question Utils
// ----------------------
export function validateSecurityQuestionsInput(questionsAnswers) {
  if (!Array.isArray(questionsAnswers)) {
    return { success: false, error: "Security questions must be an array" };
  }
  if (questionsAnswers.length !== REQUIRED_SECURITY_QUESTIONS) {
    return {
      success: false,
      error: `Exactly ${REQUIRED_SECURITY_QUESTIONS} security questions are required`,
    };
  }

  const questionIndices = new Set();
  for (let i = 0; i < questionsAnswers.length; i++) {
    const qa = questionsAnswers[i];
    if (
      typeof qa.questionIndex !== "number" ||
      qa.questionIndex < 0 ||
      qa.questionIndex >= SECURITY_QUESTION_POOL.length
    ) {
      return {
        success: false,
        error: `Invalid question index at position ${i}`,
      };
    }
    if (
      !qa.answer ||
      typeof qa.answer !== "string" ||
      qa.answer.trim().length < MIN_SECURITY_ANSWER_LENGTH
    ) {
      return {
        success: false,
        error: `Answer at position ${i} must be a string of at least ${MIN_SECURITY_ANSWER_LENGTH} characters`,
      };
    }
    if (questionIndices.has(qa.questionIndex)) {
      return {
        success: false,
        error: "Duplicate security questions are not allowed",
      };
    }
    questionIndices.add(qa.questionIndex);
  }

  return { success: true };
}

export async function hashSecurityAnswers(questionsAnswers) {
  try {
    const hashedQuestions = await Promise.all(
      questionsAnswers.map(async (qa) => ({
        question: SECURITY_QUESTION_POOL[qa.questionIndex],
        questionIndex: qa.questionIndex,
        answerHash: await bcrypt.hash(qa.answer.trim().toLowerCase(), 10),
      }))
    );
    return { success: true, securityQuestions: hashedQuestions };
  } catch (error) {
    return { success: false, error: "Failed to hash security answers" };
  }
}

export async function validateSecurityAnswers(user, answers) {
  if (!user.securityQuestions || user.securityQuestions.length === 0) {
    return { success: false, error: "No security questions configured" };
  }
  if (
    !Array.isArray(answers) ||
    answers.length !== user.securityQuestions.length
  ) {
    return {
      success: false,
      error: `Expected ${user.securityQuestions.length} answers`,
    };
  }

  for (let i = 0; i < user.securityQuestions.length; i++) {
    const isCorrect = await bcrypt.compare(
      (answers[i] || "").trim().toLowerCase(),
      user.securityQuestions[i].answerHash
    );
    if (!isCorrect) {
      return {
        success: false,
        error: "Incorrect security answer",
        questionIndex: i,
      };
    }
  }
  return { success: true };
}

// ----------------------
// Registration Helper
// ----------------------
export async function validateRegistrationSecurityQuestions(questionsAnswers) {
  const validation = validateSecurityQuestionsInput(questionsAnswers);
  if (!validation.success) return validation;

  const hashResult = await hashSecurityAnswers(questionsAnswers);
  if (!hashResult.success) return hashResult;

  return { success: true, securityQuestions: hashResult.securityQuestions };
}

// ----------------------
// Auth Functions
// ----------------------
export async function handleLogin(user, password, req) {
  const now = new Date();

  // Check if account is currently locked
  if (user.lockUntil && user.lockUntil > now) {
    const remaining = Math.ceil((user.lockUntil - now) / 1000); // seconds remaining
    return {
      success: false,
      error: `Account is temporarily locked. Try again in ${remaining} seconds.`,
      attemptsRemaining: 0,
    };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    // Increment failed attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.lastFailedLoginAt = now;

    // Lock account if max attempts reached
    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(now.getTime() + LOCK_TIME);
      user.failedLoginAttempts = 0; // reset after locking
    }

    await user.save();

    return {
      success: false,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - user.failedLoginAttempts),
    };
  }

  // Reset failed attempts and lock info on successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = now;
  await user.save();

  // Generate tokens
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  await Session.create({
    userId: user._id,
    refreshTokenHash: refreshTokenHash,
    issuedAt: now,
    expiresAt: expiresAt,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    lastLoginAt: user.lastLoginAt,
    lastFailedLoginAt: user.lastFailedLoginAt,
  };
}

export async function refreshTokens(oldRefreshToken, req) {
  try {
    const payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);

    // Find all valid sessions for this user
    const sessions = await Session.find({
      userId: payload.id,
      revokedAt: null,
    });

    if (!sessions || sessions.length === 0) {
      return { success: false, error: "Invalid refresh token" };
    }

    // Find the session that matches this refresh token
    let validSession = null;
    for (const session of sessions) {
      const isValid = await bcrypt.compare(
        oldRefreshToken,
        session.refreshTokenHash
      );
      if (isValid) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      return { success: false, error: "Invalid refresh token" };
    }

    // Get user to get role
    const user = await User.findById(payload.id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Create new tokens
    const accessToken = jwt.sign(
      { id: payload.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    const newRefreshToken = jwt.sign(
      { id: payload.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Hash and save new refresh token
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    validSession.refreshTokenHash = newRefreshTokenHash;
    validSession.issuedAt = now;
    validSession.expiresAt = expiresAt;
    await validSession.save();

    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      userId: payload.id,
    };
  } catch (error) {
    console.error("Token refresh error:", error.message);
    return { success: false, error: "Refresh token invalid or expired" };
  }
}

export async function logout(refreshToken) {
  try {
    const session = await Session.findOne({ refreshToken, revokedAt: null });
    if (!session) return { success: false, error: "Invalid session" };
    session.revokedAt = new Date();
    await session.save();
    return { success: true };
  } catch {
    return { success: false, error: "Logout failed" };
  }
}

// ----------------------
// Change Password
// ----------------------
export async function changePassword(
  user,
  currentPassword,
  newPassword,
  securityAnswers,
  req,
  forceLogoutAllSessions = false,
  forceChange = false
) {
  const now = new Date();

  // Step 0: Check minimum password age (skip for force change)
  if (!forceChange && user.passwordChangedAt) {
    if (now - user.passwordChangedAt < MIN_PASSWORD_AGE) {
      return {
        success: false,
        error: "Password must be at least 1 day old before it can be changed",
      };
    }
  }

  // Step 1: Validate current password (skip for force change)
  if (!forceChange) {
    const validCurrent = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!validCurrent)
      return { success: false, error: "Current password is incorrect" };
  }

  // Step 2: Validate security answers (non-admin, skip for force change)
  if (!forceChange && user.role !== "ADMIN") {
    const secAnsValid = await validateSecurityAnswers(user, securityAnswers);
    if (!secAnsValid.success)
      return { success: false, error: secAnsValid.error };
  }

  // Step 2b: Validate security answers (for force change, always validate)
  if (forceChange) {
    const secAnsValid = await validateSecurityAnswers(user, securityAnswers);
    if (!secAnsValid.success)
      return { success: false, error: secAnsValid.error };
  }

  // Step 3: Check password history
  const historyCheck = await checkPasswordHistory(newPassword, user);
  if (!historyCheck.success)
    return { success: false, error: historyCheck.error };

  // Step 4: Update password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHistory = [
    user.passwordHash,
    ...(user.passwordHistory || []),
  ].slice(0, PASSWORD_HISTORY_LIMIT);
  user.passwordHash = passwordHash;
  user.passwordChangedAt = now;
  await user.save();

  // Step 5: Revoke sessions if requested
  if (forceLogoutAllSessions) {
    await Session.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: now }
    );
  }

  return { success: true };
}
// ----------------------
// Forgot Password Policy Validation
// ----------------------
export async function validateForgotPasswordPolicy(
  user,
  newPassword,
  confirmPassword,
  securityAnswers,
  req
) {
  const passCheck = validatePasswordMatch(newPassword, confirmPassword);
  if (!passCheck.success)
    return {
      success: false,
      error: passCheck.error,
      step: "password_validation",
    };

  const secAnsCheck = await validateSecurityAnswers(user, securityAnswers);
  if (!secAnsCheck.success)
    return {
      success: false,
      error: secAnsCheck.error,
      step: "security_answers",
    };

  const historyCheck = await checkPasswordHistory(newPassword, user);
  if (!historyCheck.success)
    return {
      success: false,
      error: historyCheck.error,
      step: "password_history",
    };

  return { success: true, step: "all_validations_passed" };
}

// ----------------------
// Admin Reset User
// ----------------------
export async function adminResetUser(adminUser, targetUserId, updates, req) {
  if (adminUser.role !== "ADMIN")
    return { success: false, error: "Only admins can perform this action" };

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) return { success: false, error: "User not found" };
  if (targetUser.role === "ADMIN")
    return { success: false, error: "Cannot reset another admin's account" };

  const { newPassword, confirmPassword, newSecurityQuestionsAnswers } = updates;
  const actionsPerformed = [];

  if (newPassword || confirmPassword) {
    const validation = validatePasswordMatch(newPassword, confirmPassword);
    if (!validation.success) return validation;

    const historyValidation = await checkPasswordHistory(
      newPassword,
      targetUser
    );
    if (!historyValidation.success) return historyValidation;

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();
    targetUser.passwordHistory = [
      targetUser.passwordHash,
      ...(targetUser.passwordHistory || []),
    ].slice(0, PASSWORD_HISTORY_LIMIT);
    targetUser.passwordHash = passwordHash;
    targetUser.passwordChangedAt = now;

    await Session.updateMany(
      { userId: targetUser._id, revokedAt: null },
      { revokedAt: now }
    );
    actionsPerformed.push("password");
  }

  if (newSecurityQuestionsAnswers) {
    const val = await hashSecurityAnswers(newSecurityQuestionsAnswers);
    if (!val.success) return val;
    targetUser.securityQuestions = val.securityQuestions;
    actionsPerformed.push("security_questions");
  }

  await targetUser.save();
  return {
    success: true,
    message: "User updated successfully",
    actionsPerformed,
  };
}
