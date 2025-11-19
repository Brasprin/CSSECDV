import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import styles from "./TeacherDashboard.module.css";

export default function TeacherDashboard() {
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
    <Layout user={user} title="Teacher Dashboard">
      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Welcome, {user?.firstName}!</h3>
          </div>
          <div className={styles.cardBody}>
            <p>
              You're logged in as a teacher. Here you can manage your courses,
              view student enrollments, and manage grades.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>My Courses</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>Your courses will appear here.</p>
            <button
              className={styles.btn}
              onClick={() => navigate("/teacher/courses")}
            >
              View Courses
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Create New Course</h3>
          </div>
          <div className={styles.cardBody}>
            <p>Start teaching by creating a new course for your students.</p>
            <button
              className={styles.btn}
              onClick={() => navigate("/teacher/courses/new")}
            >
              Create Course
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Student Management</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Manage your course students and enrollments here.
            </p>
            <button
              className={styles.btn}
              onClick={() => navigate("/teacher/students")}
            >
              Manage Students
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Grading</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.placeholder}>
              Grade your students and manage their academic performance.
            </p>
            <button className={styles.btn}>Grade Students</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
