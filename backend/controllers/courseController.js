import {
  createCourseHelper,
  getTeacherCoursesHelper,
  getCourseByIdHelper,
  updateCourseHelper,
  deleteCourseHelper,
  enrollStudentHelper,
  dropStudentHelper,
  gradeStudentHelper,
  getCourseGradesHelper,
  getStudentGradesHelper,
  getCourseEnrolledStudentsHelper,
  removeStudentFromCourseHelper,
} from "../helpers/courseHelpers.js";

import { auditHelper } from "../helpers/auditHelpers.js";

// ----------------------
// COURSE MANAGEMENT
// ----------------------
export async function createCourseController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const teacherId = req.user._id;
    const course = await createCourseHelper(req.body, teacherId);

    // Log successful course creation
    await auditHelper({
      req,
      action: "CREATE_COURSE_SUCCESS",
      entityType: "COURSE",
      entityId: course._id,
      metadata: { courseTitle: course.title, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(201).json({ success: true, course });
  } catch (error) {
    console.error(error);

    // Log failed course creation
    await auditHelper({
      req,
      action: "CREATE_COURSE_FAILED",
      entityType: "COURSE",
      metadata: { error: error.message, ip, userAgent },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function getTeacherCoursesController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const courses = await getTeacherCoursesHelper(req.user._id);

    // Log action of viewing teacher courses
    await auditHelper({
      req,
      action: "VIEW_TEACHER_COURSES",
      entityType: "COURSE",
      entityId: req.user._id,
      metadata: { count: courses.length, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error(error);

    // Log failed attempt to fetch courses
    await auditHelper({
      req,
      action: "VIEW_TEACHER_COURSES_FAILED",
      entityType: "COURSE",
      metadata: { error: error.message, ip, userAgent },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch courses" });
  }
}

export async function getCourseByIdController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const courseId = req.params.courseId;

  try {
    const course = await getCourseByIdHelper(courseId);

    await auditHelper({
      req,
      action: "VIEW_COURSE_BY_ID",
      entityType: "COURSE",
      entityId: courseId,
      metadata: { ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, course });
  } catch (error) {
    console.error(error);

    await auditHelper({
      req,
      action: "VIEW_COURSE_BY_ID_FAILED",
      entityType: "COURSE",
      entityId: courseId,
      metadata: { error: error.message, ip, userAgent },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(404).json({ success: false, error: "Course not found" });
  }
}

export async function updateCourseController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const courseId = req.params.courseId;

  try {
    const course = await updateCourseHelper(courseId, req.user._id, req.body);

    if (!course) {
      // Log failed update attempt
      await auditHelper({
        req,
        action: "UPDATE_COURSE_FAILED_NOT_FOUND",
        entityType: "COURSE",
        entityId: courseId,
        metadata: { ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Log successful course update
    await auditHelper({
      req,
      action: "UPDATE_COURSE_SUCCESS",
      entityType: "COURSE",
      entityId: courseId,
      metadata: { updatedFields: req.body, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, course });
  } catch (error) {
    console.error(error);

    // Log server error during update
    await auditHelper({
      req,
      action: "UPDATE_COURSE_FAILED_SERVER_ERROR",
      entityType: "COURSE",
      entityId: courseId,
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function deleteCourseController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const courseId = req.params.courseId;

  try {
    const course = await deleteCourseHelper(courseId, req.user._id);

    if (!course) {
      // Log failed deletion attempt
      await auditHelper({
        req,
        action: "DELETE_COURSE_FAILED_NOT_FOUND",
        entityType: "COURSE",
        entityId: courseId,
        metadata: { ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Log successful course deletion
    await auditHelper({
      req,
      action: "DELETE_COURSE_SUCCESS",
      entityType: "COURSE",
      entityId: courseId,
      metadata: { ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res
      .status(200)
      .json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);

    // Log server error during deletion
    await auditHelper({
      req,
      action: "DELETE_COURSE_FAILED_SERVER_ERROR",
      entityType: "COURSE",
      entityId: courseId,
      metadata: { error: error.message, ip, userAgent },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}
// ----------------------
// ENROLLMENT MANAGEMENT
// ----------------------
export async function enrollStudentController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const courseId = req.params.courseId;

  try {
    const enrollment = await enrollStudentHelper(courseId, req.user._id);

    // Log successful enrollment
    await auditHelper({
      req,
      action: "ENROLL_STUDENT_SUCCESS",
      entityType: "ENROLLMENT",
      entityId: enrollment._id,
      metadata: { courseId, studentId: req.user._id, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    console.error(error);

    // Log failed enrollment
    await auditHelper({
      req,
      action: "ENROLL_STUDENT_FAILED",
      entityType: "ENROLLMENT",
      metadata: {
        courseId,
        studentId: req.user._id,
        error: error.message,
        ip,
        userAgent,
      },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function dropStudentController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const courseId = req.params.courseId;

  try {
    const enrollment = await dropStudentHelper(courseId, req.user._id);

    if (!enrollment) {
      // Log failed drop (not enrolled)
      await auditHelper({
        req,
        action: "DROP_STUDENT_FAILED_NOT_ENROLLED",
        entityType: "ENROLLMENT",
        metadata: { courseId, studentId: req.user._id, ip, userAgent },
        severity: "WARNING",
        status: "FAILURE",
      });

      return res
        .status(404)
        .json({ success: false, error: "Student not enrolled in course" });
    }

    // Log successful drop
    await auditHelper({
      req,
      action: "DROP_STUDENT_SUCCESS",
      entityType: "ENROLLMENT",
      entityId: enrollment._id,
      metadata: { courseId, studentId: req.user._id, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    console.error(error);

    // Log server error during drop
    await auditHelper({
      req,
      action: "DROP_STUDENT_FAILED_SERVER_ERROR",
      entityType: "ENROLLMENT",
      metadata: {
        courseId,
        studentId: req.user._id,
        error: error.message,
        ip,
        userAgent,
      },
      severity: "CRITICAL",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// GRADING MANAGEMENT
// ----------------------
export async function gradeStudentController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const { courseId, studentId } = req.params;
  const teacherId = req.user._id;
  const { value } = req.body;

  try {
    const grade = await gradeStudentHelper(
      courseId,
      studentId,
      value,
      teacherId
    );

    // Log successful grading
    await auditHelper({
      req,
      action: "GRADE_STUDENT_SUCCESS",
      entityType: "GRADE",
      entityId: grade._id,
      metadata: {
        courseId,
        studentId,
        teacherId,
        gradeValue: value,
        ip,
        userAgent,
      },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Student graded successfully",
      grade,
    });
  } catch (error) {
    console.error(error);

    // Log failed grading
    await auditHelper({
      req,
      action: "GRADE_STUDENT_FAILED",
      entityType: "GRADE",
      metadata: {
        courseId,
        studentId,
        teacherId,
        gradeValue: value,
        error: error.message,
        ip,
        userAgent,
      },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function getCourseGradesController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const teacherId = req.user._id;
  const { courseId } = req.params;

  try {
    const grades = await getCourseGradesHelper(courseId, teacherId);

    // Log successful fetch
    await auditHelper({
      req,
      action: "GET_COURSE_GRADES_SUCCESS",
      entityType: "GRADE",
      metadata: { courseId, teacherId, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, grades });
  } catch (error) {
    console.error(error);

    // Log failed fetch
    await auditHelper({
      req,
      action: "GET_COURSE_GRADES_FAILED",
      entityType: "GRADE",
      metadata: { courseId, teacherId, error: error.message, ip, userAgent },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function getStudentGradesController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const studentId = req.user._id;

  try {
    const grades = await getStudentGradesHelper(studentId);

    // Log successful fetch
    await auditHelper({
      req,
      action: "GET_STUDENT_GRADES_SUCCESS",
      entityType: "GRADE",
      metadata: { studentId, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, grades });
  } catch (error) {
    console.error(error);

    // Log failed fetch
    await auditHelper({
      req,
      action: "GET_STUDENT_GRADES_FAILED",
      entityType: "GRADE",
      metadata: { studentId, error: error.message, ip, userAgent },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// STUDENT ENROLLMENT RETRIEVAL
// ----------------------
export async function getCourseEnrolledStudentsController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const teacherId = req.user._id;
  const { courseId } = req.params;

  try {
    const students = await getCourseEnrolledStudentsHelper(courseId, teacherId);

    // Log successful fetch
    await auditHelper({
      req,
      action: "GET_COURSE_ENROLLED_STUDENTS_SUCCESS",
      entityType: "ENROLLMENT",
      metadata: { courseId, teacherId, count: students.length, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error(error);

    // Log failed fetch
    await auditHelper({
      req,
      action: "GET_COURSE_ENROLLED_STUDENTS_FAILED",
      entityType: "ENROLLMENT",
      metadata: { courseId, teacherId, error: error.message, ip, userAgent },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}

// ----------------------
// TEACHER REMOVE STUDENT FROM COURSE
// ----------------------
export async function removeStudentFromCourseController(req, res) {
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const teacherId = req.user._id;
  const { courseId, studentId } = req.params;

  try {
    const enrollment = await removeStudentFromCourseHelper(
      courseId,
      studentId,
      teacherId
    );

    // Log successful removal
    await auditHelper({
      req,
      action: "REMOVE_STUDENT_FROM_COURSE_SUCCESS",
      entityType: "ENROLLMENT",
      entityId: enrollment._id,
      metadata: { courseId, studentId, teacherId, ip, userAgent },
      severity: "INFO",
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Student removed from course successfully",
      enrollment,
    });
  } catch (error) {
    console.error(error);

    // Log failed removal
    await auditHelper({
      req,
      action: "REMOVE_STUDENT_FROM_COURSE_FAILED",
      entityType: "ENROLLMENT",
      metadata: {
        courseId,
        studentId,
        teacherId,
        error: error.message,
        ip,
        userAgent,
      },
      severity: "WARNING",
      status: "FAILURE",
    });

    return res.status(400).json({ success: false, error: error.message });
  }
}
