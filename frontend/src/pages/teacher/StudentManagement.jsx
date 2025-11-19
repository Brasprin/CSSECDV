import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { courseService } from "../../services/courseService";
import styles from "./StudentManagement.module.css";

export default function StudentManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

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
        // Auto-select first course if available
        if (data?.courses && data.courses.length > 0) {
          setSelectedCourseId(data.courses[0]._id);
        }
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

  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!selectedCourseId) return;

      setLoadingStudents(true);
      setError("");
      try {
        const { data } = await courseService.getCourseEnrolledStudents(
          selectedCourseId,
          token
        );
        setEnrolledStudents(data?.students || data || []);
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data?.error || e.message || "Failed to load students"
        );
      } finally {
        setLoadingStudents(false);
      }
    };

    if (token) {
      fetchEnrolledStudents();
    }
  }, [selectedCourseId, token]);

  const handleRemoveClick = (studentId, studentName) => {
    setStudentToDelete({ studentId, studentName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    setRemovingStudentId(studentToDelete.studentId);
    setShowDeleteModal(false);
    try {
      await courseService.removeStudentFromCourse(
        selectedCourseId,
        studentToDelete.studentId,
        token
      );
      // Refresh the student list
      setEnrolledStudents(
        enrolledStudents.filter((s) => s.studentId !== studentToDelete.studentId)
      );
      setError("");
      setStudentToDelete(null);
    } catch (e) {
      console.error("Error removing student:", e);
      setError(
        e?.response?.data?.error || e.message || "Failed to remove student"
      );
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
  };

  if (!user) {
    return <div className={styles.container}>Loading...</div>;
  }

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);

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
        <h2 className={styles.pageHeaderTitle}>Student Management</h2>
      </div>
      <div className={styles.container}>
        <div className={styles.courseSelector}>
          <label htmlFor="courseSelect" className={styles.label}>
            Select Course:
          </label>
          <select
            id="courseSelect"
            className={styles.select}
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">-- Choose a course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.section} - {course.title}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className={styles.loading}>Loading courses...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && courses.length === 0 && (
          <div className={styles.empty}>No courses found.</div>
        )}

        {!loading && courses.length > 0 && selectedCourse && (
          <div className={styles.courseInfo}>
            <div className={styles.courseHeader}>
              <div>
                <h3 className={styles.courseTitle}>{selectedCourse.title}</h3>
                <p className={styles.courseDetails}>
                  {selectedCourse.code} - Section {selectedCourse.section}
                </p>
              </div>
              <div className={styles.courseStats}>
                <span
                  className={`${styles.capacityBadge} ${
                    (selectedCourse.enrolledCount || 0) >=
                    selectedCourse.capacity
                      ? styles.capacityFull
                      : ""
                  }`}
                >
                  {selectedCourse.enrolledCount || 0}/{selectedCourse.capacity}
                </span>
              </div>
            </div>

            {loadingStudents && (
              <div className={styles.loading}>Loading students...</div>
            )}

            {!loadingStudents && enrolledStudents.length === 0 && (
              <div className={styles.empty}>No enrolled students.</div>
            )}

            {!loadingStudents && enrolledStudents.length > 0 && (
              <div className={styles.studentsTableWrap}>
                <table className={styles.studentsTable}>
                  <thead className={styles.thead}>
                    <tr>
                      <th>Email</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Enrolled At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {enrolledStudents.map((student) => (
                      <tr key={student.enrollmentId} className={styles.row}>
                        <td className={styles.email}>{student.email}</td>
                        <td>{student.firstName}</td>
                        <td>{student.lastName}</td>
                        <td className={styles.date}>
                          {new Date(student.enrolledAt).toLocaleString()}
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            className={styles.removeButton}
                            onClick={() =>
                              handleRemoveClick(
                                student.studentId,
                                `${student.firstName} ${student.lastName}`
                              )
                            }
                            disabled={removingStudentId === student.studentId}
                            aria-label={`Remove ${student.firstName} ${student.lastName}`}
                          >
                            {removingStudentId === student.studentId
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showDeleteModal && studentToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Remove Student</h3>
              <button
                className={styles.modalCloseButton}
                onClick={handleCancelDelete}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to remove <strong>{studentToDelete.studentName}</strong> from this course?
              </p>
              <p className={styles.modalWarning}>This action cannot be undone.</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleConfirmDelete}
              >
                Remove Student
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
