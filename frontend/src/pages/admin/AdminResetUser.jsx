import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { authService } from "../../services/authService";
import styles from "../auth/Register.module.css";
import styles2 from "../admin/AdminResetUser.module.css";

const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "Minimum 8 characters", regex: /.{8,}/ },
  {
    id: "uppercase",
    label: "At least one uppercase letter (A-Z)",
    regex: /[A-Z]/,
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter (a-z)",
    regex: /[a-z]/,
  },
  { id: "number", label: "At least one number (0-9)", regex: /[0-9]/ },
  {
    id: "special",
    label: "At least one special character (!@#$%^&*)",
    regex: /[!@#$%^&*]/,
  },
];

export default function AdminResetUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { state } = useLocation();
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [securityQuestionPool, setSecurityQuestionPool] = useState([]);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
    securityQuestions: [
      { questionIndex: null, answer: "" },
      { questionIndex: null, answer: "" },
      { questionIndex: null, answer: "" },
    ],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityAnswers, setShowSecurityAnswers] = useState([
    false,
    false,
    false,
  ]);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== "ADMIN") {
        navigate("/dashboard");
        return;
      }
      setAdmin(userData);
    } catch (e) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await authService.getSecurityQuestions();
        if (res.data && Array.isArray(res.data)) {
          setSecurityQuestionPool(res.data);
        } else if (res.data?.questions) {
          setSecurityQuestionPool(res.data.questions);
        }
      } catch (e) {
        setError("Failed to load security questions. Please try again.");
      } finally {
        setQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const targetName = useMemo(() => state?.userName || "Selected user", [state]);
  const targetEmail = useMemo(() => state?.userEmail || "", [state]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, newPassword: value }));
    const newReqs = {};
    PASSWORD_REQUIREMENTS.forEach((req) => {
      newReqs[req.id] = req.regex.test(value);
    });
    setPasswordRequirements(newReqs);
    setPasswordMatch(value === formData.confirmPassword && value !== "");
    if (error) setError("");
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, confirmPassword: value }));
    setPasswordMatch(formData.newPassword === value && value !== "");
    if (error) setError("");
  };

  const handleSecurityQuestionChange = (index, questionIndex) => {
    setFormData((prev) => {
      const sq = [...prev.securityQuestions];
      sq[index].questionIndex = questionIndex;
      return { ...prev, securityQuestions: sq };
    });
    if (error) setError("");
  };

  const handleSecurityAnswerChange = (index, value) => {
    setFormData((prev) => {
      const sq = [...prev.securityQuestions];
      sq[index].answer = value;
      return { ...prev, securityQuestions: sq };
    });
    if (error) setError("");
  };

  const toggleSecurityAnswerVisibility = (index) => {
    setShowSecurityAnswers((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const getAvailableQuestions = (currentIndex) => {
    const selected = formData.securityQuestions
      .map((q, idx) => (idx !== currentIndex ? q.questionIndex : null))
      .filter((idx) => idx !== null);

    return securityQuestionPool.map((q, index) => ({
      index,
      question: q,
      disabled: selected.includes(index),
    }));
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Unauthorized. Please login again.");
      return;
    }

    // basic front-end checks mirroring Register style
    if (!isPasswordValid) {
      setError("Password does not meet all requirements");
      return;
    }
    if (!passwordMatch) {
      setError("Passwords do not match");
      return;
    }

    const allQuestionsAnswered = formData.securityQuestions.every(
      (q) => q.questionIndex !== null && q.answer.trim().length >= 3
    );
    if (!allQuestionsAnswered) {
      setError(
        "All security questions must be answered with at least 3 characters"
      );
      return;
    }

    setLoading(true);
    try {
      // Compose updates payload per backend adminResetUserController
      const updates = {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
        newSecurityQuestionsAnswers: formData.securityQuestions,
      };

      await authService.adminResetUser(
        { targetUserId: userId, updates },
        token
      );

      setSuccess("Redirecting to user management...");

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/admin/user-management", {
          state: { message: `Password updated for ${targetName}` },
          replace: true,
        });
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to reset user password";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <Layout user={admin}>
      {/* Success Popup Modal */}
      {success && (
        <div className={styles2.successOverlay}>
          <div className={styles2.successContent}>
            <div className={styles2.successIcon}>✓</div>
            <h2 className={styles2.successTitle}>Password Reset Successfully!</h2>
            <p className={styles2.successMessage}>{success}</p>
          </div>
        </div>
      )}

      <div className={styles2.registerContainer}>
        <div className={styles.registerCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Reset User Password</h1>
            <p className={styles.subtitle}>
              {targetName}
              {targetEmail ? ` • ${targetEmail}` : ""}
            </p>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* New Password */}
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                New Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className={styles.input}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className={styles.eyeIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className={styles.eyeIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <div className={styles.requirementsContainer}>
                {PASSWORD_REQUIREMENTS.map((req) => (
                  <div
                    key={req.id}
                    className={`${styles.requirement} ${
                      passwordRequirements[req.id] ? styles.met : styles.unmet
                    }`}
                  >
                    <span className={styles.checkmark}>
                      {passwordRequirements[req.id] ? "✓" : "✗"}
                    </span>
                    <span className={styles.requirementText}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm new password"
                  className={styles.input}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.eyeButton}
                  disabled={loading}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      className={styles.eyeIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className={styles.eyeIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <div
                  className={`${styles.matchIndicator} ${
                    passwordMatch ? styles.matched : styles.unmatched
                  }`}
                >
                  {passwordMatch
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </div>
              )}
            </div>

            {/* Security Questions */}
            <div className={styles.securityQuestionsSection}>
              <h3 className={styles.sectionTitle}>Security Questions</h3>
              <p className={styles.sectionSubtitle}>
                Enter 3 new security questions and answers
              </p>

              {formData.securityQuestions.map((question, index) => (
                <div key={index} className={styles.securityQuestionGroup}>
                  <label className={styles.label}>
                    Security Question {index + 1}
                  </label>

                  <select
                    value={question.questionIndex ?? ""}
                    onChange={(e) =>
                      handleSecurityQuestionChange(
                        index,
                        e.target.value === "" ? null : parseInt(e.target.value)
                      )
                    }
                    className={styles.select}
                    disabled={loading || questionsLoading}
                  >
                    <option value="">Select a security question</option>
                    {getAvailableQuestions(index).map((q) => (
                      <option
                        key={q.index}
                        value={q.index}
                        disabled={q.disabled}
                      >
                        {q.question}
                      </option>
                    ))}
                  </select>

                  {question.questionIndex !== null && (
                    <div className={styles.answerWrapper}>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={
                            showSecurityAnswers[index] ? "text" : "password"
                          }
                          value={question.answer}
                          onChange={(e) =>
                            handleSecurityAnswerChange(index, e.target.value)
                          }
                          placeholder="Enter answer"
                          className={styles.input}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecurityAnswerVisibility(index)}
                          className={styles.eyeButton}
                          disabled={loading}
                          aria-label={
                            showSecurityAnswers[index]
                              ? "Hide answer"
                              : "Show answer"
                          }
                        >
                          {showSecurityAnswers[index] ? (
                            <svg
                              className={styles.eyeIcon}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className={styles.eyeIcon}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.formRow}>
              <button
                type="button"
                className={styles.submitButton}
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !isPasswordValid || !passwordMatch}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
