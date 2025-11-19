import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { courseService } from "../../services/courseService";
import styles from "./GradeStudents.module.css";

const VALID_GRADES = [
  "4.0",
  "3.5",
  "3.0",
  "2.5",
  "2.0",
  "1.5",
  "1.0",
  "0.0",
  "W",
];

export default function GradeStudents() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [grades, setGrades] = useState({});
  const [currentGrades, setCurrentGrades] = useState({});
  const [gradingStudentId, setGradingStudentId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
        setGrades({});

        // Fetch current grades for this course
        try {
          const gradesData = await courseService.getCourseGrades(
            selectedCourseId,
            token
          );
          const gradesMap = {};
          if (gradesData?.data?.grades) {
            gradesData.data.grades.forEach((grade) => {
              gradesMap[grade.studentId] = grade.value;
            });
          }
          setCurrentGrades(gradesMap);
        } catch (gradeError) {
          console.error("Failed to fetch grades:", gradeError);
          setCurrentGrades({});
        }
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

  const handleGradeChange = (studentId, gradeValue) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: gradeValue,
    }));
  };

  const handleSubmitGrade = async (studentId, studentName) => {
    const gradeValue = grades[studentId];

    if (!gradeValue) {
      setError("Please select a grade");
      return;
    }

    setGradingStudentId(studentId);
    setError("");
    setSuccessMessage("");

    try {
      await courseService.gradeStudent(
        selectedCourseId,
        studentId,
        { value: gradeValue },
        token
      );

      setSuccessMessage(`${studentName} has been graded with ${gradeValue}`);
      setGrades((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });

      // Sync grades immediately after submission
      try {
        const gradesData = await courseService.getCourseGrades(
          selectedCourseId,
          token
        );
        const gradesMap = {};
        if (gradesData?.data?.grades) {
          gradesData.data.grades.forEach((grade) => {
            gradesMap[grade.studentId] = grade.value;
          });
        }
        setCurrentGrades(gradesMap);
      } catch (syncError) {
        console.error("Failed to sync grades:", syncError);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Error grading student:", e);
      setError(
        e?.response?.data?.error || e.message || "Failed to grade student"
      );
    } finally {
      setGradingStudentId(null);
    }
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
        <h2 className={styles.pageHeaderTitle}>Grade Students</h2>
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
        {successMessage && (
          <div className={styles.success}>{successMessage}</div>
        )}

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
                      <th>Grade</th>
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
                        <td className={styles.gradeCell}>
                          <div className={styles.gradeInputGroup}>
                            <select
                              className={`${styles.gradeSelect} ${
                                currentGrades[student.studentId]
                                  ? styles.gradeSelectFilled
                                  : ""
                              }`}
                              value={
                                grades[student.studentId] ||
                                currentGrades[student.studentId] ||
                                ""
                              }
                              onChange={(e) =>
                                handleGradeChange(
                                  student.studentId,
                                  e.target.value
                                )
                              }
                              disabled={gradingStudentId === student.studentId}
                            >
                              <option value="">
                                {currentGrades[student.studentId]
                                  ? `Current: ${
                                      currentGrades[student.studentId]
                                    }`
                                  : "-- Select Grade --"}
                              </option>
                              {VALID_GRADES.map((grade) => (
                                <option key={grade} value={grade}>
                                  {grade}
                                </option>
                              ))}
                            </select>
                            <button
                              className={styles.submitGradeButton}
                              onClick={() =>
                                handleSubmitGrade(
                                  student.studentId,
                                  `${student.firstName} ${student.lastName}`
                                )
                              }
                              disabled={
                                !grades[student.studentId] ||
                                gradingStudentId === student.studentId
                              }
                            >
                              {gradingStudentId === student.studentId
                                ? "Submitting..."
                                : "Submit"}
                            </button>
                          </div>
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
    </Layout>
  );
}
