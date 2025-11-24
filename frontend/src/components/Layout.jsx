import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import styles from "./Layout.module.css";

export default function Layout({ children, title, user }) {
  const navigate = useNavigate();
  
  // [AUDIT MODIFICATION START]
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState(null);
  const [lastFailedLoginTime, setLastFailedLoginTime] = useState(null);

  useEffect(() => {
    // Check for audit timestamps in local storage
    const successAudit = localStorage.getItem("lastLoginAudit");
    const failedAudit = localStorage.getItem("lastFailedLoginAudit");

    let shouldShow = false;

    if (successAudit) {
      setLastLoginTime(new Date(successAudit));
      localStorage.removeItem("lastLoginAudit");
      shouldShow = true;
    }

    if (failedAudit) {
      setLastFailedLoginTime(new Date(failedAudit));
      localStorage.removeItem("lastFailedLoginAudit");
      shouldShow = true;
    }

    if (shouldShow) {
      setShowAuditModal(true);
    }
  }, []);
  // [AUDIT MODIFICATION END]

  const handleCloseModal = () => {
    setShowAuditModal(false);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        // Call the logout API to revoke the refresh token on the backend
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      
      // Clear any lingering audit keys just in case
      localStorage.removeItem("lastLoginAudit");
      localStorage.removeItem("lastFailedLoginAudit");

      // Redirect to login
      navigate("/login");
    }
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Header/Navbar */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <h1>Animosys</h1>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>

            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {title && <h2 className={styles.pageTitle}>{title}</h2>}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 CSSECDV. All rights reserved.</p>
      </footer>

      {/* [AUDIT MODIFICATION: MODAL UI] */}
      {showAuditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Security Audit Notice</h3>
            <div className="modal-body">
              <p>Welcome back, <strong>{user?.firstName}</strong>.</p>
              
              {/* Last Successful Login */}
              {lastLoginTime && (
                <div className="mb-md">
                  <p className="mb-xs">Your last successful login was on:</p>
                  <strong>
                    {lastLoginTime.toLocaleDateString()} at{" "}
                    {lastLoginTime.toLocaleTimeString()}
                  </strong>
                </div>
              )}

              {/* Last Failed Login (Highlighted) */}
              {lastFailedLoginTime && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: '0.5rem',
                  border: '1px solid #ef4444'
                }}>
                  <p className="mb-xs" style={{ color: '#991b1b', fontWeight: 'bold' }}>
                    ⚠️ Last failed login attempt:
                  </p>
                  <strong style={{ color: '#b91c1c' }}>
                    {lastFailedLoginTime.toLocaleDateString()} at{" "}
                    {lastFailedLoginTime.toLocaleTimeString()}
                  </strong>
                </div>
              )}

              <p className="text-muted text-small mt-lg">
                If any of these activities look suspicious, please update your password immediately.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="btn btn-primary">
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}