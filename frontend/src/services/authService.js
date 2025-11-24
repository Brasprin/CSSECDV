import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth";

export const authService = {
  // Config endpoints
  getAuthConfig: () => axios.get(`${API_URL}/config`),
  getSecurityQuestions: () => axios.get(`${API_URL}/security-questions`),
  getPasswordRequirements: () => axios.get(`${API_URL}/password-requirements`),
  validatePassword: (password) =>
    axios.post(`${API_URL}/validate-password`, { password }),
  register: (data) => axios.post(`${API_URL}/register`, data),
  
  // [AUDIT MODIFICATION]
  login: async (data) => {
    const response = await axios.post(`${API_URL}/login`, data);
    
    // Intercept response to store audit timestamps
    if (response.data) {
      if (response.data.lastLogin) {
        localStorage.setItem("lastLoginAudit", response.data.lastLogin);
      }
      if (response.data.lastFailedLogin) {
        localStorage.setItem("lastFailedLoginAudit", response.data.lastFailedLogin);
      }
    }

    return response;
  },

  logout: (refreshToken) => axios.post(`${API_URL}/logout`, { refreshToken }),
  refreshToken: (refreshToken) =>
    axios.post(`${API_URL}/refresh-token`, { refreshToken }),
  changePassword: (data, token) =>
    axios.post(`${API_URL}/change-password`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  forgotPassword: (data) => axios.post(`${API_URL}/forgot-password`, data),
  getSecurityQuestionsForForgotPassword: (email) =>
    axios.post(`${API_URL}/forgot-password/get-questions`, { email }),
  adminResetUser: (data, token) =>
    axios.post(`${API_URL}/admin/reset-user`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getSecurityQuestions: () => axios.get(`${API_URL}/security-questions`),
};