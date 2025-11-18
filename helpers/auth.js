import bcrypt from "bcrypt";
import Session from "../models/Session.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { auditAuth } from "./audit.js"; //  audit helper

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 10 * 60 * 1000; // 10 min
const MIN_PASSWORD_AGE = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_HISTORY_LIMIT = 2;
const REQUIRED_SECURITY_QUESTIONS = 3;
const MIN_SECURITY_ANSWER_LENGTH = 3;

const SECURITY_QUESTION_POOL = [
  "What is the name of your first pet?",
  "What is your mother's maiden name?",
  "What street did you grow up on?",
  "What is the name of your first nephew or niece?",
  "What was the model of your first car?",
  "What city were you born in?",
  "What was the first concert you attended?",
  "What is the name of your first best friend from childhood?",
];

export function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export async function checkEmailExists(email) {
  try {
    if (!email || typeof email !== "string") {
      return {
        success: false,
        error: "Email is required and must be a string",
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email format is valid first
    if (!validateEmail(normalizedEmail)) {
      return {
        success: false,
        error: "Invalid email format",
      };
    }

    // Query database for existing email
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return {
        success: false,
        exists: true,
        error: "Email already registered",
      };
    }

    return {
      success: true,
      exists: false,
      message: "Email is available",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error checking email availability",
    };
  }
}

export function validatePassword(password) {
  const minLen = 8;
  const complexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  return (
    typeof password === "string" &&
    password.length >= minLen &&
    complexity.test(password)
  );
}

export function validatePasswordMatch(password, confirmPassword) {
  // Check if both passwords are provided
  if (!password || !confirmPassword) {
    return {
      success: false,
      error: "Password and confirm password are required",
    };
  }

  // Check if passwords are strings
  if (typeof password !== "string" || typeof confirmPassword !== "string") {
    return {
      success: false,
      error: "Password and confirm password must be strings",
    };
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Passwords do not match",
    };
  }

  // Check if password meets policy
  if (!validatePassword(password)) {
    return {
      success: false,
      error: "Password does not meet policy",
    };
  }

  return { success: true };
}

export async function handleLogin(user, password, req) {
  const now = new Date();

  // Check lockout
  if (user.lockUntil && user.lockUntil > now) {
    const secondsRemaining = Math.ceil((user.lockUntil - now) / 1000);
    return {
      success: false,
      attemptsRemaining: 0,
      lockout: { until: user.lockUntil.toISOString(), secondsRemaining },
    };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    // Increment failed login
    user.failedLoginCount = (user.failedLoginCount || 0) + 1;
    user.lastFailedLoginAt = now;

    let locked = false;
    if (user.failedLoginCount >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME);
      user.failedLoginCount = 0;
      locked = true;
    }

    await user.save();

    const attemptsRemaining = locked
      ? 0
      : Math.max(0, MAX_ATTEMPTS - user.failedLoginCount);
    const response = { success: false, attemptsRemaining };
    if (user.lockUntil && user.lockUntil > now) {
      response.lockout = {
        until: user.lockUntil.toISOString(),
        secondsRemaining: Math.ceil((user.lockUntil - now) / 1000),
      };
    }
    return response;
  }

  // Successful login: reset counters
  const prevLastLoginAt = user.lastLoginAt;
  const prevLastFailedLoginAt = user.lastFailedLoginAt;
  user.failedLoginCount = 0;
  user.lockUntil = null;
  user.lastLoginAt = now;
  await user.save();

  // Generate tokens
  const accessToken = jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { sub: String(user._id) },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Session.create({
    userId: user._id,
    refreshTokenHash,
    issuedAt: now,
    expiresAt: exp,
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
    lastLoginAt: prevLastLoginAt,
    lastFailedLoginAt: prevLastFailedLoginAt,
  };
}

export async function refreshTokens(oldRefreshToken, req) {
  try {
    // Verify refresh token signature
    const payload = jwt.verify(oldRefreshToken, process.env.REFRESH_SECRET);

    const session = await Session.findOne({ userId: payload.sub }).sort({
      issuedAt: -1,
    });

    if (!session) return { success: false, error: "Invalid session" };

    // Verify hashed refresh token
    const validToken = await bcrypt.compare(
      oldRefreshToken,
      session.refreshTokenHash
    );
    if (!validToken) return { success: false, error: "Invalid token" };

    const userId = payload.sub;

    // Generate new tokens
    const accessToken = jwt.sign({ sub: userId }, process.env.ACCESS_SECRET, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign(
      { sub: userId },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    // Save new session
    const now = new Date();
    const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await Session.create({
      userId,
      refreshTokenHash: newRefreshTokenHash,
      issuedAt: now,
      expiresAt: exp,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Optionally, delete old refresh token or keep a history
    await Session.deleteOne({ userId: payload.sub, refreshTokenHash: hash });

    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      userId,
    };
  } catch (err) {
    return { success: false, error: "Invalid token" };
  }
}

export async function logout(refreshToken) {
  if (!refreshToken) return { success: false, error: "No token provided" };

  try {
    // Decode refresh token to get userId
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Delete the session associated with this token
    await Session.deleteOne({ userId: payload.sub });

    return { success: true };
  } catch (err) {
    return { success: false, error: "Invalid token" };
  }
}

export async function changePassword(
  user,
  currentPassword,
  newPassword,
  req,
  forceLogoutAllSessions = false
) {
  const now = new Date();

  // Check current password
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return { success: false, error: "Current password is incorrect" };

  // Enforce min password age
  if (
    user.passwordChangedAt &&
    now - user.passwordChangedAt < MIN_PASSWORD_AGE
  ) {
    const nextChangeTime = new Date(
      user.passwordChangedAt.getTime() + MIN_PASSWORD_AGE
    );
    const secondsRemaining = Math.ceil((nextChangeTime - now) / 1000);

    await auditAuth(
      "PASSWORD_CHANGE_FAILURE",
      String(user._id),
      user.role,
      String(user._id),
      { reason: "min-age", secondsRemaining },
      req
    ).catch(() => {});

    return {
      success: false,
      error: "password recently changed",
      nextChangeTime,
      secondsRemaining,
    };
  }

  // Prevent reuse from history
  const allHashes = [user.passwordHash, ...(user.passwordHistory || [])];
  for (const h of allHashes) {
    if (await bcrypt.compare(newPassword, h)) {
      await auditAuth(
        "PASSWORD_CHANGE_FAILURE",
        String(user._id),
        user.role,
        String(user._id),
        { reason: "reuse" },
        req
      ).catch(() => {});
      return {
        success: false,
        error: "New password cannot be the same as a previous password.",
      };
    }
  }

  // Rotate history (cap 2)
  user.passwordHistory = [
    user.passwordHash,
    ...(user.passwordHistory || []),
  ].slice(0, PASSWORD_HISTORY_LIMIT);

  // Update password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordChangedAt = now;
  await user.save();

  // Force logout all sessions
  if (forceLogoutAllSessions) {
    const sessions = await Session.find({ userId: user._id, revokedAt: null });
    const nowTs = new Date();
    for (const s of sessions) {
      s.revokedAt = nowTs;
      await s.save();
    }
  }

  await auditAuth(
    "PASSWORD_CHANGE_SUCCESS",
    String(user._id),
    user.role,
    String(user._id),
    {},
    req
  ).catch(() => {});

  return { success: true };
}

export async function validateSecurityAnswers(user, answers) {
  // Check if user has security questions
  if (!user.securityQuestions || user.securityQuestions.length === 0) {
    return { success: false, error: "No security questions configured" };
  }

  // Check if answers array matches questions count
  if (
    !Array.isArray(answers) ||
    answers.length !== user.securityQuestions.length
  ) {
    return {
      success: false,
      error: `Expected ${user.securityQuestions.length} answers`,
    };
  }

  // Verify each answer
  for (let i = 0; i < user.securityQuestions.length; i++) {
    const question = user.securityQuestions[i];
    const providedAnswer = (answers[i] || "").trim().toLowerCase();

    const isCorrect = await bcrypt.compare(providedAnswer, question.answerHash);
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

export async function checkPasswordHistory(newPassword, user) {
  // Check against last PASSWORD_HISTORY_LIMIT passwords (current + 1 previous)
  const recentPasswords = [
    user.passwordHash,
    ...(user.passwordHistory || []),
  ].slice(0, PASSWORD_HISTORY_LIMIT);

  for (const hash of recentPasswords) {
    const isMatch = await bcrypt.compare(newPassword, hash);
    if (isMatch) {
      return {
        success: false,
        error:
          "New password cannot be the same as one of your last 2 passwords",
      };
    }
  }

  return { success: true };
}

export async function validateForgotPasswordPolicy(
  user,
  newPassword,
  confirmPassword,
  securityAnswers,
  req
) {
  // Step 1: Validate password format and match
  const passwordValidation = validatePasswordMatch(
    newPassword,
    confirmPassword
  );
  if (!passwordValidation.success) {
    return {
      success: false,
      error: passwordValidation.error,
      step: "password_validation",
    };
  }

  // Step 2: Validate security answers
  const answersValidation = await validateSecurityAnswers(
    user,
    securityAnswers
  );
  if (!answersValidation.success) {
    await auditAuth(
      "FORGOT_PASSWORD_SECURITY_ANSWER_FAILURE",
      String(user._id),
      user.role,
      String(user._id),
      { questionIndex: answersValidation.questionIndex },
      req
    ).catch(() => {});

    return {
      success: false,
      error: answersValidation.error,
      step: "security_answers",
    };
  }

  // Step 3: Check password history (last PASSWORD_HISTORY_LIMIT passwords)
  const historyValidation = await checkPasswordHistory(newPassword, user);
  if (!historyValidation.success) {
    await auditAuth(
      "FORGOT_PASSWORD_HISTORY_CHECK_FAILURE",
      String(user._id),
      user.role,
      String(user._id),
      { reason: "password_reuse" },
      req
    ).catch(() => {});

    return {
      success: false,
      error: historyValidation.error,
      step: "password_history",
    };
  }

  // All validations passed
  await auditAuth(
    "FORGOT_PASSWORD_POLICY_VALIDATED",
    String(user._id),
    user.role,
    String(user._id),
    {},
    req
  ).catch(() => {});

  return { success: true, step: "all_validations_passed" };
}

export function getSecurityQuestionPool() {
  return SECURITY_QUESTION_POOL;
}

export function validateSecurityQuestionsInput(questionsAnswers) {
  // Check if input is provided
  if (!questionsAnswers) {
    return {
      success: false,
      error: "Security questions and answers are required",
    };
  }

  // Check if it's an array
  if (!Array.isArray(questionsAnswers)) {
    return {
      success: false,
      error: "Security questions must be an array",
    };
  }

  // Check if exactly 3 questions are provided
  if (questionsAnswers.length !== REQUIRED_SECURITY_QUESTIONS) {
    return {
      success: false,
      error: `Exactly ${REQUIRED_SECURITY_QUESTIONS} security questions are required`,
    };
  }

  // Validate each question-answer pair
  for (let i = 0; i < questionsAnswers.length; i++) {
    const qa = questionsAnswers[i];

    // Check if question index is valid
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

    // Check if answer is provided
    if (!qa.answer || typeof qa.answer !== "string") {
      return {
        success: false,
        error: `Answer at position ${i} is required and must be a string`,
      };
    }

    // Check answer length (minimum 3 characters)
    const trimmedAnswer = qa.answer.trim();
    if (trimmedAnswer.length < MIN_SECURITY_ANSWER_LENGTH) {
      return {
        success: false,
        error: `Answer at position ${i} must be at least ${MIN_SECURITY_ANSWER_LENGTH} characters`,
      };
    }

    // Check for duplicate questions
    const questionIndices = questionsAnswers.map((q) => q.questionIndex);
    if (new Set(questionIndices).size !== questionIndices.length) {
      return {
        success: false,
        error: "Duplicate security questions are not allowed",
      };
    }
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

    return {
      success: true,
      securityQuestions: hashedQuestions,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to hash security answers",
    };
  }
}

export async function validateRegistrationSecurityQuestions(questionsAnswers) {
  // Step 1: Validate input format
  const inputValidation = validateSecurityQuestionsInput(questionsAnswers);
  if (!inputValidation.success) {
    return inputValidation;
  }

  // Step 2: Hash the answers
  const hashResult = await hashSecurityAnswers(questionsAnswers);
  if (!hashResult.success) {
    return hashResult;
  }

  return {
    success: true,
    securityQuestions: hashResult.securityQuestions,
  };
}
export async function adminResetUser(adminUser, targetUserId, updates, req) {
  const { newPassword, confirmPassword, newSecurityQuestionsAnswers } = updates;

  // ----------------------------------------
  // Step 1: Verify admin
  // ----------------------------------------
  if (adminUser.role !== "ADMIN") {
    return { success: false, error: "Only admins can perform this action" };
  }

  // ----------------------------------------
  // Step 2: Find target user
  // ----------------------------------------
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  // Prevent admin reset for another admin
  if (targetUser.role === "ADMIN") {
    return {
      success: false,
      error: "Cannot reset another admin's account",
    };
  }

  // Track actions for logging response
  const actionsPerformed = [];

  // ----------------------------------------
  // Step 3: Reset Password (if provided)
  // ----------------------------------------
  if (newPassword || confirmPassword) {
    const validation = validatePasswordMatch(newPassword, confirmPassword);
    if (!validation.success) return validation;

    const historyValidation = await checkPasswordHistory(
      newPassword,
      targetUser
    );
    if (!historyValidation.success) return historyValidation;

    const now = new Date();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    targetUser.passwordHistory = [
      targetUser.passwordHash,
      ...(targetUser.passwordHistory || []),
    ].slice(0, PASSWORD_HISTORY_LIMIT);

    targetUser.passwordHash = passwordHash;
    targetUser.passwordChangedAt = now;

    // Revoke all user sessions
    const sessions = await Session.find({
      userId: targetUser._id,
      revokedAt: null,
    });
    for (const s of sessions) {
      s.revokedAt = now;
      await s.save();
    }

    actionsPerformed.push("password");
  }

  // ----------------------------------------
  // Step 4: Reset Security Questions (if provided)
  // ----------------------------------------
  if (newSecurityQuestionsAnswers) {
    const val = await validateRegistrationSecurityQuestions(
      newSecurityQuestionsAnswers
    );
    if (!val.success) return val;

    targetUser.securityQuestions = val.securityQuestions;
    actionsPerformed.push("security_questions");
  }

  // ----------------------------------------
  // Step 5: Save updates
  // ----------------------------------------
  await targetUser.save();

  // Audit log
  await auditAuth(
    "ADMIN_USER_RESET_SUCCESS",
    String(adminUser._id),
    adminUser.role,
    String(targetUser._id),
    { actionsPerformed, email: targetUser.email },
    req
  ).catch(() => {});

  return {
    success: true,
    message: "User updated successfully",
    actionsPerformed,
  };
}
