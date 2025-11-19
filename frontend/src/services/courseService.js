import axios from "axios";

const API_URL =
  import.meta.env.VITE_COURSES_API_URL || "http://localhost:5000/api/courses";

export const courseService = {
  // Teacher
  createCourse: (data, token) =>
    axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getTeacherCourses: (token) =>
    axios.get(`${API_URL}/teacher`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateCourse: (courseId, data, token) =>
    axios.put(`${API_URL}/${courseId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  deleteCourse: (courseId, token) =>
    axios.delete(`${API_URL}/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getCourse: (courseId, token) =>
    axios.get(`${API_URL}/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Student
  enrollCourse: (courseId, token) =>
    axios.post(
      `${API_URL}/${courseId}/enroll`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ),
  dropCourse: (courseId, token) =>
    axios.delete(`${API_URL}/${courseId}/drop`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Grades
  gradeStudent: (courseId, studentId, data, token) =>
    axios.post(`${API_URL}/${courseId}/grade/${studentId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getCourseGrades: (courseId, token) =>
    axios.get(`${API_URL}/${courseId}/grades`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getStudentGrades: (token) =>
    axios.get(`${API_URL}/grades/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Enrolled Students
  getCourseEnrolledStudents: (courseId, token) =>
    axios.get(`${API_URL}/${courseId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  removeStudentFromCourse: (courseId, studentId, token) =>
    axios.delete(`${API_URL}/${courseId}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
