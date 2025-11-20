import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { courseService } from "../../services/courseService";
import styles from "./MyStudentCourses.module.css";

export default function MyStudentCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [enrolling, setEnrolling] = useState({});
  const [dropping, setDropping] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

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
        const list = (data?.courses || []).filter((c) => !!c.studentStatus);
        const order = { ENROLLED: 0, DROPPED: 1, FINISHED: 2 };
        list.sort((a, b) => (order[a.studentStatus] ?? 99) - (order[b.studentStatus] ?? 99));
        setCourses(list);
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.error || e.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchCourses();
  }, [token]);

  const onEnroll = async (courseId) => {
    setError("");
    setEnrolling((p) => ({ ...p, [courseId]: true }));
    try {
      await courseService.enrollCourse(courseId, token);
      setCourses((prev) =>
        prev
          .map((c) =>
            c._id === courseId
              ? { ...c, studentStatus: "ENROLLED", enrolled: true, enrolledCount: (c.enrolledCount || 0) + 1 }
              : c
          )
          .sort((a, b) => {
            const order = { ENROLLED: 0, DROPPED: 1, FINISHED: 2 };
            return (order[a.studentStatus] ?? 99) - (order[b.studentStatus] ?? 99);
          })
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
        prev
          .map((c) =>
            c._id === courseId
              ? { ...c, studentStatus: "DROPPED", enrolled: false, enrolledCount: Math.max(0, (c.enrolledCount || 1) - 1) }
              : c
          )
          .sort((a, b) => {
            const order = { ENROLLED: 0, DROPPED: 1, FINISHED: 2 };
            return (order[a.studentStatus] ?? 99) - (order[b.studentStatus] ?? 99);
          })
      );
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || e.message || "Failed to drop";
      setError(msg);
    } finally {
      setDropping((p) => ({ ...p, [courseId]: false }));
    }
  };

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;

    const query = searchQuery.toLowerCase();
    return courses.filter((course) => {
      return (
        course.code?.toLowerCase().includes(query) ||
        course.section?.toLowerCase().includes(query) ||
        course.title?.toLowerCase().includes(query) ||
        course.status?.toLowerCase().includes(query) ||
        course.studentStatus?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        String(course.capacity).includes(query) ||
        String(course.enrolledCount || 0).includes(query) ||
        (course.droppingAllowed ? "allowed" : "not allowed").includes(query)
      );
    });
  }, [courses, searchQuery]);

  if (!user) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back">
          <span className={styles.backButtonIcon}>←</span>
          Back
        </button>
        <h2 className={styles.pageHeaderTitle}>My Courses</h2>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <input
            type="text"
            placeholder="Search by code, section, title, status, enrollment status, capacity, or dropping policy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && courses.length === 0 && (
          <div className={styles.empty}>You have no course history yet.</div>
        )}

        {!loading && filteredCourses.length === 0 && courses.length > 0 && (
          <div className={styles.empty}>No courses match your search.</div>
        )}

        {!loading && filteredCourses.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Code</th>
                  <th>Section</th>
                  <th>Title</th>
                  <th>Enrollment</th>
                  <th>Course</th>
                  <th>Dropping</th>
                  <th>Capacity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {filteredCourses.map((c) => {
                  const isOpen = c.status === "OPEN";
                  const isFull = (c.enrolledCount || 0) >= (c.capacity || 0);

                  const canReenroll = c.studentStatus === "DROPPED" && isOpen && !isFull;
                  const canDrop = c.studentStatus === "ENROLLED" && c.droppingAllowed === true;

                  const enrollmentBadge =
                    c.studentStatus === "ENROLLED" ? (
                      <span className={styles.badgeEnrolled}>Enrolled</span>
                    ) : c.studentStatus === "DROPPED" ? (
                      <span className={styles.badgeDropped}>Dropped</span>
                    ) : (
                      <span className={styles.badgeFinished}>Finished</span>
                    );

                  return (
                    <tr key={c._id} className={styles.row}>
                      <td>{c.code}</td>
                      <td>{c.section}</td>
                      <td>{c.title}</td>
                      <td>{enrollmentBadge}</td>
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
                            <span className={styles.policyDotNotAllowed} /> Not allowed
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.capacityDisplay} ${
                            isFull ? styles.capacityFull : ""
                          }`}
                        >
                          {(c.enrolledCount || 0)}/{c.capacity}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {c.studentStatus === "ENROLLED" && !canDrop && (
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
                          {c.studentStatus === "DROPPED" && (
                            <button
                              className={`${styles.btn} ${styles.btnPrimary}`}
                              disabled={!canReenroll || !!enrolling[c._id]}
                              onClick={() => onEnroll(c._id)}
                            >
                              {enrolling[c._id] ? "Enrolling..." : canReenroll ? "Re-enroll" : "Unavailable"}
                            </button>
                          )}
                          {c.studentStatus === "FINISHED" && (
                            <button className={styles.btn} disabled>
                              Finished
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
