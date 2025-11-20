import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { courseService } from "../../services/courseService";
import styles from "./MyGrades.module.css";

export default function MyGrades() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const token = useMemo(() => localStorage.getItem("accessToken"), []);

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
    } catch (e) {
      console.error("Failed to parse user data", e);
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch all courses with studentStatus and the student's grades
        const [coursesRes, gradesRes] = await Promise.all([
          courseService.getAllCourses(token),
          courseService.getStudentGrades(token),
        ]);

        const courses = (coursesRes?.data?.courses || []).filter(
          (c) => !!c.studentStatus
        );
        const grades = gradesRes?.data?.grades || [];

        // Map grades by courseId
        const gradeMap = new Map(
          grades.map((g) => [String(g.courseId), { value: g.value, updatedAt: g.updatedAt || g.createdAt }])
        );

        // Merge
        const merged = courses.map((c) => {
          const g = gradeMap.get(String(c._id));
          return {
            ...c,
            gradeValue: g?.value || null,
            gradeUpdated: g?.updatedAt || null,
          };
        });

        // Sort by enrollment status to match MyStudentCourses: ENROLLED, DROPPED, FINISHED
        const order = { ENROLLED: 0, DROPPED: 1, FINISHED: 2 };
        merged.sort(
          (a, b) => (order[a.studentStatus] ?? 99) - (order[b.studentStatus] ?? 99)
        );

        setRows(merged);
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data?.error || e.message || "Failed to load grades"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  if (!user) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className={styles.headerRow}>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <span className={styles.backButtonIcon}>←</span>
          Back
        </button>
        <h2 className={styles.pageHeaderTitle}>My Grades</h2>
      </div>

      <div className={styles.container}>
        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && rows.length === 0 && (
          <div className={styles.empty}>You have no course records yet.</div>
        )}

        {!loading && rows.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Code</th>
                  <th>Section</th>
                  <th>Title</th>
                  <th>Enrollment</th>
                  <th>Dropping</th>
                  <th>Grade</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {rows.map((c) => {
                  
                  const enrollmentBadge =
                    c.studentStatus === "ENROLLED" ? (
                      <span className={styles.badgeEnrolled}>Enrolled</span>
                    ) : c.studentStatus === "DROPPED" ? (
                      <span className={styles.badgeDropped}>Dropped</span>
                    ) : (
                      <span className={styles.badgeFinished}>Finished</span>
                    );

                  const gradeEl = c.gradeValue ? (
                    <span className={styles.badgeGrade}>{c.gradeValue}</span>
                  ) : (
                    <span className={styles.textMuted}>No grade yet</span>
                  );

                  return (
                    <tr key={c._id} className={styles.row}>
                      <td>{c.code}</td>
                      <td>{c.section}</td>
                      <td>{c.title}</td>
                      <td>{enrollmentBadge}</td>
                                            <td>
                        {c.droppingAllowed ? (
                          <span className={styles.policyAllowedActive}>
                            <span className={styles.policyDotAllowed} /> Allowed
                          </span>
                        ) : (
                          <span className={styles.policyNotAllowedActive}>
                            <span className={styles.policyDotNotAllowed} /> Not allowed
                          </span>
                        )}
                      </td>
                                            <td>{gradeEl}</td>
                      <td>
                        {c.gradeUpdated
                          ? new Date(c.gradeUpdated).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
