// controllers/userController.js
import User from "../models/User.js";
import Course from "../models/Course.js"; // optional, for teacher-student metadata
import { auditHelper } from "../helpers/auditHelpers.js";

// ----------------------
// ADMIN: List all users
// ----------------------
export async function getAllUsersController(req, res) {
  try {
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, error: "Access denied: Admins only" });
    }

    const users = await User.find({}, "firstName lastName email role lastLoginAt lastFailedLoginAt createdAt lockUntil").lean();

    return res.status(200).json({ success: true, users, count: users.length });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch users" });
  }
}

// ----------------------
// TEACHER: Get students of a course
// ----------------------
export async function getCourseStudentsController(req, res) {
  try {
    if (req.user.role !== "TEACHER") {
      return res
        .status(403)
        .json({ success: false, error: "Access denied: Teachers only" });
    }

    const { courseId } = req.params;

    // Ensure this teacher owns the course
    const course = await Course.findOne({
      _id: courseId,
      teacherId: req.user._id,
    })
      .populate("students", "firstName lastName email") // populate student metadata
      .lean();

    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    return res.status(200).json({ success: true, students: course.students });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch students" });
  }
}

// ----------------------
// ADMIN: Update user role
// ----------------------
export async function updateUserRoleController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    if (req.user.role !== "ADMIN") {
      await auditHelper({
        req,
        action: "UPDATE_USER_ROLE_FAILED_UNAUTHORIZED",
        entityType: "USER",
        metadata: { ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res
        .status(403)
        .json({ success: false, error: "Access denied: Admins only" });
    }

    const { userId, newRole } = req.body;

    // Validate newRole
    if (!["ADMIN", "TEACHER", "STUDENT"].includes(newRole)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid role" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      await auditHelper({
        req,
        action: "UPDATE_USER_ROLE_FAILED_USER_NOT_FOUND",
        entityType: "USER",
        entityId: userId,
        metadata: { ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    // Prevent changing admin roles
    if (targetUser.role === "ADMIN") {
      await auditHelper({
        req,
        action: "UPDATE_USER_ROLE_FAILED_CANNOT_CHANGE_ADMIN",
        entityType: "USER",
        entityId: userId,
        metadata: { ip, userAgent, attemptedRole: newRole },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res
        .status(403)
        .json({ success: false, error: "Cannot change admin role" });
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    await auditHelper({
      req,
      action: "UPDATE_USER_ROLE_SUCCESS",
      entityType: "USER",
      entityId: userId,
      metadata: { ip, userAgent, oldRole, newRole },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: targetUser._id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error(error);

    await auditHelper({
      req,
      action: "UPDATE_USER_ROLE_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Failed to update user role" });
  }
}

// ----------------------
// USER: Update own profile
// ----------------------
export async function updateProfileController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const { firstName, lastName } = req.body;
    const userId = req.user.id;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ success: false, error: "First name and last name are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      await auditHelper({
        req,
        action: "UPDATE_PROFILE_FAILED_USER_NOT_FOUND",
        entityType: "USER",
        entityId: userId,
        metadata: { ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    await user.save();

    await auditHelper({
      req,
      action: "UPDATE_PROFILE_SUCCESS",
      entityType: "USER",
      entityId: userId,
      metadata: { ip, userAgent, firstName, lastName },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    await auditHelper({
      req,
      action: "UPDATE_PROFILE_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Failed to update profile" });
  }
}

// ----------------------
// USER: Delete own account
// ----------------------
export async function deleteAccountController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      await auditHelper({
        req,
        action: "DELETE_ACCOUNT_FAILED_USER_NOT_FOUND",
        entityType: "USER",
        entityId: userId,
        metadata: { ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    // Prevent admin from deleting their own account
    if (user.role === "ADMIN") {
      await auditHelper({
        req,
        action: "DELETE_ACCOUNT_FAILED_ADMIN_PROTECTION",
        entityType: "USER",
        entityId: userId,
        metadata: { ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });
      return res
        .status(403)
        .json({ success: false, error: "Admins cannot delete their own account" });
    }

    const email = user.email;
    await User.findByIdAndDelete(userId);

    await auditHelper({
      req,
      action: "DELETE_ACCOUNT_SUCCESS",
      entityType: "USER",
      entityId: userId,
      metadata: { ip, userAgent, email },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error(error);

    await auditHelper({
      req,
      action: "DELETE_ACCOUNT_FAILED_SERVER_ERROR",
      entityType: "USER",
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Failed to delete account" });
  }
}
