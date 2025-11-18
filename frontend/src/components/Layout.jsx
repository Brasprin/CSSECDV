import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import styles from "./Layout.module.css";

export default function Layout({ children, title, user }) {
  const navigate = useNavigate();

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
            <h1>SecDEV</h1>
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
        <p>&copy; 2024 SecDEV. All rights reserved.</p>
      </footer>
    </div>
  );
}
