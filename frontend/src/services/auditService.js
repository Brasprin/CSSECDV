import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/audits";

export const auditService = {
  getAudits: (token, logType = "BOTH") =>
    axios.get(`${API_URL}?logType=${logType}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
