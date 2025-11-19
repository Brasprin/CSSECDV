import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { courseService } from "../../services/courseService";
import styles from "./MyCourses.module.css";

export default function MyCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [edits, setEdits] = useState({});
  const [enrollmentCounts, setEnrollmentCounts] = useState({});

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
        const { data } = await courseService.getTeacherCourses(token);
        setCourses(data?.courses || []);
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data?.error || e.message || "Failed to load courses"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchCourses();
  }, [token]);

  const startEdit = (course) => {
    setEditId(course._id);
    setEdits({
      code: course.code || "",
      section: course.section || "",
      title: course.title || "",
      description: course.description || "",
      capacity: String(course.capacity ?? 0),
      status: course.status || "OPEN",
      droppingAllowed: !!course.droppingAllowed,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEdits({});
  };

  const saveEdit = async (courseId) => {
    setError("");
    // validations
    const cap = Number(edits.capacity);
    if (!Number.isInteger(cap) || cap < 0) {
      setError("Capacity must be a non-negative integer");
      return;
    }

    try {
      const payload = {
        code: edits.code.trim(),
        section: edits.section.trim(),
        title: edits.title.trim(),
        description: edits.description.trim() || undefined,
        capacity: cap,
        status: edits.status,
        droppingAllowed: !!edits.droppingAllowed,
      };

      const { data } = await courseService.updateCourse(
        courseId,
        payload,
        token
      );
      const updated = data?.course;
      setCourses((prev) => prev.map((c) => (c._id === courseId ? updated : c)));
      setEditId(null);
      setEdits({});
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.error || e.message || "Failed to update course"
      );
    }
  };

  const setField = (name, value) => setEdits((p) => ({ ...p, [name]: value }));

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
        <h2 className={styles.pageHeaderTitle}>My Courses</h2>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <button
              className={styles.btn}
              onClick={() => navigate("/teacher/courses/new")}
            >
              Create Course
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && courses.length === 0 && (
          <div className={styles.empty}>No courses found.</div>
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
                  <th>Created At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {courses.map((c) => {
                  const isEditing = editId === c._id;
                  return (
                    <tr key={c._id} className={styles.row}>
                      <td>
                        {isEditing ? (
                          <input
                            className={styles.input}
                            value={edits.code}
                            onChange={(e) => setField("code", e.target.value)}
                          />
                        ) : (
                          c.code
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className={styles.input}
                            value={edits.section}
                            onChange={(e) =>
                              setField("section", e.target.value)
                            }
                          />
                        ) : (
                          c.section
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className={styles.input}
                            value={edits.title}
                            onChange={(e) => setField("title", e.target.value)}
                          />
                        ) : (
                          c.title
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className={styles.select}
                            value={edits.status}
                            onChange={(e) => setField("status", e.target.value)}
                          >
                            <option value="OPEN">Open</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        ) : c.status === "OPEN" ? (
                          <span className={styles.badgeOpen}>Open</span>
                        ) : (
                          <span className={styles.badgeClosed}>Closed</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div
                            className={styles.policyGroup}
                            role="group"
                            aria-label="Dropping policy"
                          >
                            <button
                              type="button"
                              className={`${styles.policyOption} ${
                                edits.droppingAllowed
                                  ? styles.policyAllowedActive
                                  : ""
                              }`}
                              onClick={() => setField("droppingAllowed", true)}
                              aria-pressed={edits.droppingAllowed}
                            >
                              <span
                                className={styles.policyDotAllowed}
                                aria-hidden="true"
                              />
                              Allowed
                            </button>
                            <button
                              type="button"
                              className={`${styles.policyOption} ${
                                !edits.droppingAllowed
                                  ? styles.policyNotAllowedActive
                                  : ""
                              }`}
                              onClick={() => setField("droppingAllowed", false)}
                              aria-pressed={!edits.droppingAllowed}
                            >
                              <span
                                className={styles.policyDotNotAllowed}
                                aria-hidden="true"
                              />
                              Not allowed
                            </button>
                          </div>
                        ) : c.droppingAllowed ? (
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
                        {isEditing ? (
                          <input
                            className={styles.input}
                            type="number"
                            min="0"
                            step="1"
                            value={edits.capacity}
                            onChange={(e) =>
                              setField("capacity", e.target.value)
                            }
                          />
                        ) : (
                          <span
                            className={`${styles.capacityDisplay} ${
                              (c.enrolledCount || 0) >= c.capacity
                                ? styles.capacityFull
                                : ""
                            }`}
                          >
                            {c.enrolledCount || 0}/{c.capacity}
                          </span>
                        )}
                      </td>
                      <td>{new Date(c.createdAt).toLocaleString()}</td>
                      <td>
                        <div className={styles.actions}>
                          {!isEditing ? (
                            <button
                              className={styles.btn}
                              onClick={() => startEdit(c)}
                            >
                              Edit
                            </button>
                          ) : (
                            <>
                              <button
                                className={styles.btn}
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={() => saveEdit(c._id)}
                              >
                                Save
                              </button>
                            </>
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
