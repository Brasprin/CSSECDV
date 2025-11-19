import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import styles from "./AdminDashboard.module.css";

const handleNavigate = (navigate, path) => {
  navigate(path);
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/login");
      return;
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return <div className={styles.loading}>Redirecting...</div>;
  }

  return (
    <Layout user={user} title="Admin Dashboard">
      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Welcome, {user?.firstName}!</h3>
          </div>
          <div className={styles.cardBody}>
            <p>
              You're logged in as an administrator. Here you can manage users,
              view audit logs, and oversee the entire system.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>User Management</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              View and manage all users in the system.
            </p>
            <button
              className={styles.btn}
              onClick={() => handleNavigate(navigate, "/admin/user-management")}
            >
              Manage Users
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Audit Logs</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              View system audit logs and user activities.
            </p>
            <button
              className={styles.btn}
              onClick={() => handleNavigate(navigate, "/admin/audit-logs")}
            >
              View Logs
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>System Settings</h3>
          </div>
          <div className={styles.cardBody}>
            <p>Configure system-wide settings and security policies.</p>
            <button className={styles.btn}>Settings</button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>User Roles</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Manage user roles and permissions.
            </p>
            <button className={styles.btn}>Manage Roles</button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Reports</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Generate and view system reports.
            </p>
            <button className={styles.btn}>View Reports</button>
          </div>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Active Sessions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>System Events</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Failed Logins</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
