import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/users";

export const userService = {
  getAllUsers: (token) =>
    axios.get(`${API_URL}/all`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getCourseStudents: (courseId, token) =>
    axios.get(`${API_URL}/course/${courseId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
