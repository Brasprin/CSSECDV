import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { courseService } from "../../services/courseService";
import styles from "./CreateCourse.module.css";

export default function CreateCourse() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    section: "",
    title: "",
    description: "",
    capacity: "40",
    status: "OPEN",
    droppingAllowed: true,
  });

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
    } catch (err) {
      console.error("Failed to parse user data:", err);
      navigate("/login");
      return;
    }
  }, [navigate]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!form.code.trim()) return "Course code is required";
    if (!form.section.trim()) return "Section is required";
    if (!form.title.trim()) return "Title is required";

    const cap = Number(form.capacity);
    if (!Number.isInteger(cap) || cap < 0) {
      return "Capacity must be a non-negative integer";
    }

    if (!["OPEN", "CLOSED"].includes(form.status)) {
      return "Status must be OPEN or CLOSED";
    }

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        code: form.code.trim(),
        section: form.section.trim(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        capacity: Number(form.capacity),
        status: form.status,
        droppingAllowed: !!form.droppingAllowed,
      };

      const { data } = await courseService.createCourse(payload, token);

      if (data?.success) {
        setMessage("Course created successfully");
        // Redirect to teacher dashboard or course details after short delay
        setTimeout(() => navigate("/teacher/dashboard"), 800);
      } else {
        setError(data?.error || "Failed to create course");
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error || err.message || "Failed to create course"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div>Loading...</div>
      </div>
    );
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
        <h2 className={styles.pageHeaderTitle}>Create New Courses</h2>
      </div>
      <div className={styles.container}>
        {error ? <div className={styles.error}>{error}</div> : null}
        {message ? <div className={styles.success}>{message}</div> : null}

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="code">
                Course Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                className={styles.input}
                placeholder="e.g., CS101"
                value={form.code}
                onChange={onChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="section">
                Section
              </label>
              <input
                id="section"
                name="section"
                type="text"
                className={styles.input}
                placeholder="e.g., A"
                value={form.section}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={styles.input}
              placeholder="e.g., Introduction to Computer Science"
              value={form.title}
              onChange={onChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              placeholder="Optional short description"
              value={form.description}
              onChange={onChange}
            />
            <div className={styles.hint}>Optional</div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="capacity">
                Capacity
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="0"
                step="1"
                className={styles.input}
                value={form.capacity}
                onChange={onChange}
                required
              />
              <div className={styles.hint}>Must be a non-negative integer</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                className={styles.select}
                value={form.status}
                onChange={onChange}
              >
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Dropping Policy</label>
            <div
              className={styles.policyGroup}
              role="radiogroup"
              aria-label="Dropping policy"
            >
              <button
                type="button"
                className={`${styles.policyOption} ${
                  form.droppingAllowed ? styles.policyAllowedActive : ""
                }`}
                onClick={() =>
                  setForm((p) => ({ ...p, droppingAllowed: true }))
                }
                aria-pressed={form.droppingAllowed}
                aria-label="Dropping allowed"
              >
                <span className={styles.policyDotAllowed} aria-hidden="true" />
                Allowed
              </button>
              <button
                type="button"
                className={`${styles.policyOption} ${
                  !form.droppingAllowed ? styles.policyNotAllowedActive : ""
                }`}
                onClick={() =>
                  setForm((p) => ({ ...p, droppingAllowed: false }))
                }
                aria-pressed={!form.droppingAllowed}
                aria-label="Dropping not allowed"
              >
                <span
                  className={styles.policyDotNotAllowed}
                  aria-hidden="true"
                />
                Not allowed
              </button>
            </div>
            <div className={styles.hint}>
              Choose if students can drop this course after enrolling.
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
