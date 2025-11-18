import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth";

export const authService = {
  register: (data) => axios.post(`${API_URL}/register`, data),
  login: (data) => axios.post(`${API_URL}/login`, data),
  logout: (refreshToken) => axios.post(`${API_URL}/logout`, { refreshToken }),
  refreshToken: (refreshToken) =>
    axios.post(`${API_URL}/refresh-token`, { refreshToken }),
  changePassword: (data, token) =>
    axios.post(`${API_URL}/change-password`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  forgotPassword: (data) => axios.post(`${API_URL}/forgot-password`, data),
  adminResetUser: (data, token) =>
    axios.post(`${API_URL}/admin/reset-user`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
