import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { auditService } from "../../services/auditService";
import styles from "./AuditLogs.module.css";

// Safely read a field from either the root or nested _doc (Mongoose doc spread)
const getField = (log, key) => {
  if (!log) return undefined;
  if (Object.prototype.hasOwnProperty.call(log, key)) return log[key];
  if (log && typeof log === "object" && log._doc && key in log._doc)
    return log._doc[key];
  return undefined;
};

const getMeta = (log) => {
  const meta = getField(log, "metadata");
  return meta && typeof meta === "object" ? meta : {};
};

export default function AuditLogs() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("BOTH");
  const [dateFilter, setDateFilter] = useState("TODAY");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== "ADMIN") {
        navigate("/dashboard");
        return;
      }
      setUser(userData);
      fetchAuditLogs(token, "BOTH");
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchAuditLogs = async (token, logType) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditService.getAudits(token, logType);
      if (response.data.success) {
        setLogs(response.data.logs);
      } else {
        setError("Failed to fetch audit logs");
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.response?.data?.error || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilterType) => {
    setFilterType(newFilterType);
    const token = localStorage.getItem("accessToken");
    fetchAuditLogs(token, newFilterType);
  };

  const getActionBadgeClass = (action) => {
    if (!action) return styles.badgeInfo;
    const act = String(action).toUpperCase();
    if (act.includes("FAILED") || act.includes("ERROR")) {
      return styles.badgeError;
    }
    if (act.includes("SUCCESS")) {
      return styles.badgeSuccess;
    }
    return styles.badgeInfo;
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return styles.severityCritical;
      case "ERROR":
        return styles.severityError;
      case "WARNING":
        return styles.severityWarning;
      case "INFO":
      default:
        return styles.severityInfo;
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === "SUCCESS" ? styles.statusSuccess : styles.statusFailure;
  };

  const formatDate = (dateInput) => {
    let date;
    if (!dateInput) return "-";
    // If dateInput is a Date or ISO string, new Date will parse it
    date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      // Attempt to parse from Mongo ObjectId timestamp if available on _id
      const id = getField(dateInput, "_id") || undefined;
      if (typeof id === "string" && id.length >= 8) {
        const ts = parseInt(id.substring(0, 8), 16) * 1000;
        const fromId = new Date(ts);
        if (!isNaN(fromId.getTime())) return fromId.toLocaleString();
      }
      return "-";
    }
    return date.toLocaleString();
  };

  const getEntityTypeLabel = (entityType) => {
    const labels = {
      USER: "User",
      COURSE: "Course",
      ENROLLMENT: "Enrollment",
      GRADE: "Grade",
      SESSION: "Session",
    };
    return labels[entityType] || entityType;
  };

  // Date range filter helper
  const withinDateFilter = (ts) => {
    if (!ts || dateFilter === "ALL") return true;
    const dt = new Date(ts);
    if (isNaN(dt.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    switch (dateFilter) {
      case "TODAY":
        return dt >= startOfToday;
      case "LAST_7": {
        const from = new Date();
        from.setDate(from.getDate() - 7);
        return dt >= from;
      }
      case "LAST_30": {
        const from = new Date();
        from.setDate(from.getDate() - 30);
        return dt >= from;
      }
      default:
        return true;
    }
  };

  const filteredLogs = logs.filter((l) =>
    withinDateFilter(getField(l, "timestamp"))
  );

  if (loading && logs.length === 0) {
    return (
      <Layout user={user} title="Audit Logs">
        <div className={styles.loading}>Loading audit logs...</div>
      </Layout>
    );
  }

  if (!user) {
    return <div className={styles.loading}>Redirecting...</div>;
  }

  return (
    <Layout user={user} title="Audit Logs">
      <div className={styles.auditContainer}>
        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={`${styles.filterGroup} ${styles.filterRow}`}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by Log Type:</label>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterBtn} ${
                    filterType === "BOTH" ? styles.filterBtnActive : ""
                  }`}
                  onClick={() => handleFilterChange("BOTH")}
                >
                  All Logs
                </button>
                <button
                  className={`${styles.filterBtn} ${
                    filterType === "SECURITY" ? styles.filterBtnActive : ""
                  }`}
                  onClick={() => handleFilterChange("SECURITY")}
                >
                  Security Logs
                </button>
                <button
                  className={`${styles.filterBtn} ${
                    filterType === "ACTION" ? styles.filterBtnActive : ""
                  }`}
                  onClick={() => handleFilterChange("ACTION")}
                >
                  Action Logs
                </button>
              </div>
            </div>

            <div className={`${styles.filterGroup} ${styles.dateFilterGroup}`}>
              <label className={styles.filterLabel} htmlFor="dateFilterSelect">
                Date:
              </label>
              <select
                id="dateFilterSelect"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={styles.dateSelect}
              >
                <option value="TODAY">Today</option>
                <option value="LAST_7">Last 7 Days</option>
                <option value="LAST_30">Last 30 Days</option>
                <option value="ALL">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Logs Count */}
        <div className={styles.logsInfo}>
          <p>
            Showing <strong>{filteredLogs.length}</strong> audit log
            {filteredLogs.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Logs Table */}
        {logs.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.logsTable}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const timestamp = getField(log, "timestamp");
                  const actorRole = getField(log, "actorRole");
                  const action = getField(log, "action");
                  const entityType = getField(log, "entityType");
                  const severity = getField(log, "severity");
                  const status = getField(log, "status");
                  const actorId = getField(log, "actorId");
                  const meta = getMeta(log);

                  const hasActor = Boolean(actorId) || Boolean(log.actorMeta);
                  const displayRole = hasActor
                    ? log.actorMeta?.role || actorRole || "-"
                    : "N/A";

                  const displayName = log.actorMeta?.name || "";
                  const displayEmail = log.actorMeta?.email || meta.email || "";

                  return (
                    <tr key={index} className={styles.logRow}>
                      <td className={styles.timestamp}>
                        {formatDate(timestamp)}
                      </td>
                      <td className={styles.actor}>
                        <div className={styles.actorInfo}>
                          <div className={styles.actorName}>
                            {displayName || displayEmail ? (
                              <>
                                {displayName ? (
                                  <span className={styles.actorFullName}>
                                    {displayName}
                                  </span>
                                ) : null}
                                {displayEmail ? (
                                  <span className={styles.actorEmail}>
                                    {displayEmail}
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className={styles.actorId}>
                                ID: {actorId || "System"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={styles.role}>
                        <span className={styles.roleBadge}>{displayRole}</span>
                      </td>
                      <td className={styles.action}>
                        <span className={getActionBadgeClass(action)}>
                          {action || "-"}
                        </span>
                      </td>
                      <td className={styles.entityType}>
                        {getEntityTypeLabel(entityType) || "-"}
                      </td>
                      <td className={styles.severity}>
                        <span className={getSeverityBadgeClass(severity)}>
                          {severity || "INFO"}
                        </span>
                      </td>
                      <td className={styles.status}>
                        <span className={getStatusBadgeClass(status)}>
                          {status || "SUCCESS"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No audit logs found for the selected filter.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
