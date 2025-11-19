import axios from "axios";

const API_URL = "http://localhost:5000/api/users";

export const userService = {
  getAllUsers: (token) =>
    axios.get(`${API_URL}/all`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getCourseStudents: (courseId, token) =>
    axios.get(`${API_URL}/course/${courseId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateUserRole: (userId, newRole, token) =>
    axios.post(
      `${API_URL}/update-role`,
      { userId, newRole },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
  updateProfile: (firstName, lastName, token) =>
    axios.post(
      `${API_URL}/update-profile`,
      { firstName, lastName },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
  deleteAccount: (token) =>
    axios.delete(`${API_URL}/delete-account`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
