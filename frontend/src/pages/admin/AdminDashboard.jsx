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
              manage roles, view audit logs, and manage your account setting.
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
            <h3>User Roles</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Manage user roles and permissions.
            </p>
            <button
              className={styles.btn}
              onClick={() => handleNavigate(navigate, "/admin/user-roles")}
            >
              Manage Roles
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Create Account</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Create new user accounts with specific roles.
            </p>
            <button
              className={styles.btn}
              onClick={() => handleNavigate(navigate, "/admin/create-account")}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Account Settings</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Manage profile, password, or delete account.
            </p>
            <button
              className={styles.btn}
              onClick={() => handleNavigate(navigate, "/account-settings")}
            >
              Account Settings
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
