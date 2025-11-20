import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { courseService } from "../../services/courseService";
import styles from "./BrowseCourses.module.css";

export default function BrowseCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [enrolling, setEnrolling] = useState({});
  const [dropping, setDropping] = useState({});

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
    const fetchCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await courseService.getAllCourses(token);
        const list = data?.courses || [];
        setCourses(list.map((c) => ({ ...c })));
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data?.error || e.message || "Failed to load courses"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  const onEnroll = async (courseId) => {
    setError("");
    setEnrolling((p) => ({ ...p, [courseId]: true }));
    try {
      await courseService.enrollCourse(courseId, token);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? {
                ...c,
                enrolled: true,
                enrolledCount: (c.enrolledCount || 0) + 1,
              }
            : c
        )
      );
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || e.message || "Failed to enroll";
      setError(msg);
    } finally {
      setEnrolling((p) => ({ ...p, [courseId]: false }));
    }
  };

  const onDrop = async (courseId) => {
    setError("");
    setDropping((p) => ({ ...p, [courseId]: true }));
    try {
      await courseService.dropCourse(courseId, token);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? {
                ...c,
                enrolled: false,
                enrolledCount: Math.max(0, (c.enrolledCount || 1) - 1),
              }
            : c
        )
      );
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || e.message || "Failed to drop";
      setError(msg);
    } finally {
      setDropping((p) => ({ ...p, [courseId]: false }));
    }
  };

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
        <h2 className={styles.pageHeaderTitle}>Browse Courses</h2>
      </div>

      <div className={styles.container}>
        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && courses.length === 0 && (
          <div className={styles.empty}>No courses to display.</div>
        )}

        {!loading && courses.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Code</th>
                  <th>Section</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Dropping</th>
                  <th>Capacity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {courses.map((c) => {
                  const isOpen = c.status === "OPEN";
                  const isFull = (c.enrolledCount || 0) >= (c.capacity || 0);
                  const canEnroll = isOpen && !isFull && !c.enrolled;
                  const canDrop = c.enrolled && c.droppingAllowed === true;

                  return (
                    <tr key={c._id} className={styles.row}>
                      <td>{c.code}</td>
                      <td>{c.section}</td>
                      <td>{c.title}</td>
                      <td>
                        {isOpen ? (
                          <span className={styles.badgeOpen}>Open</span>
                        ) : (
                          <span className={styles.badgeClosed}>Closed</span>
                        )}
                      </td>
                      <td>
                        {c.droppingAllowed ? (
                          <span className={styles.policyAllowedActive}>
                            <span className={styles.policyDotAllowed} /> Allowed
                          </span>
                        ) : (
                          <span className={styles.policyNotAllowedActive}>
                            <span className={styles.policyDotNotAllowed} /> Not
                            allowed
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.capacityDisplay} ${
                            isFull ? styles.capacityFull : ""
                          }`}
                        >
                          {c.enrolledCount || 0}/{c.capacity}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {canEnroll && (
                            <button
                              className={`${styles.btn} ${styles.btnPrimary}`}
                              disabled={!!enrolling[c._id]}
                              onClick={() => onEnroll(c._id)}
                            >
                              {enrolling[c._id] ? "Enrolling..." : "Enroll"}
                            </button>
                          )}
                          {c.enrolled && !canDrop && (
                            <button className={styles.btn} disabled>
                              Dropping not available
                            </button>
                          )}
                          {canDrop && (
                            <button
                              className={styles.btn}
                              disabled={!!dropping[c._id]}
                              onClick={() => onDrop(c._id)}
                            >
                              {dropping[c._id] ? "Dropping..." : "Drop"}
                            </button>
                          )}
                          {!canEnroll && !c.enrolled && (
                            <button className={styles.btn} disabled>
                              {isFull ? "Full" : "Unavailable"}
                            </button>
                          )}
                        </div>
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
