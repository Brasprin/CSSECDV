import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import styles from "./StudentDashboard.module.css";

export default function StudentDashboard() {
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
    <Layout user={user} title="Student Dashboard">
      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Welcome, {user?.firstName}!</h3>
          </div>
          <div className={styles.cardBody}>
            <p>
              You're logged in as a student. Here you can view your enrolled
              courses, check your grades, and manage your academic progress.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Enrolled Courses</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Your enrolled courses will appear here.
            </p>
            <button className={styles.btn}>View Courses</button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>My Grades</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Your grades and academic performance will appear here.
            </p>
            <button className={styles.btn}>View Grades</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
