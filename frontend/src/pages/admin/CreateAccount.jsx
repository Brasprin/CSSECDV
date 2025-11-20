import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { authService } from "../../services/authService";
import { userService } from "../../services/userService";
import styles from "./CreateAccount.module.css";
import accountStyles from "../shared/AccountSettings.module.css";

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

const ROLES = [
  { value: "STUDENT", label: "Student" },
  { value: "TEACHER", label: "Teacher" },
  { value: "ADMIN", label: "Admin" },
];

export default function CreateAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [securityQuestionPool, setSecurityQuestionPool] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // Check admin access and fetch security questions
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");

    if (!storedUser || !storedToken) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== "ADMIN") {
        navigate("/dashboard");
        return;
      }
      setUser(userData);
      setToken(storedToken);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/login");
      return;
    }

    // Fetch security questions
    const fetchSecurityQuestions = async () => {
      try {
        const response = await authService.getSecurityQuestions();
        if (response.data && Array.isArray(response.data)) {
          setSecurityQuestionPool(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch security questions:", err);
        setError("Failed to load security questions. Please refresh the page.");
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchSecurityQuestions();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      password: value,
    }));

    const newRequirements = {};
    PASSWORD_REQUIREMENTS.forEach((req) => {
      newRequirements[req.id] = req.regex.test(value);
    });
    setPasswordRequirements(newRequirements);
    setPasswordMatch(value === formData.confirmPassword && value !== "");

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleConfirmPasswordChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      confirmPassword: value,
    }));

    setPasswordMatch(formData.password === value && value !== "");

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSecurityQuestionChange = (index, questionIndex) => {
    setFormData((prev) => {
      const newQuestions = [...prev.securityQuestions];
      newQuestions[index].questionIndex = questionIndex;
      return {
        ...prev,
        securityQuestions: newQuestions,
      };
    });
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSecurityAnswerChange = (index, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.securityQuestions];
      newQuestions[index].answer = value;
      return {
        ...prev,
        securityQuestions: newQuestions,
      };
    });
    if (error) setError("");
    if (success) setSuccess("");
  };

  const toggleSecurityAnswerVisibility = (index) => {
    setShowSecurityAnswers((prev) => {
      const newShow = [...prev];
      newShow[index] = !newShow[index];
      return newShow;
    });
  };

  const getAvailableQuestions = (currentIndex) => {
    const selectedIndices = formData.securityQuestions
      .map((q, idx) => (idx !== currentIndex ? q.questionIndex : null))
      .filter((idx) => idx !== null);

    return securityQuestionPool.map((question, index) => ({
      index,
      question,
      disabled: selectedIndices.includes(index),
    }));
  };

  const isPasswordValid = Object.values(passwordRequirements).every(
    (req) => req
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.firstName.trim()) {
        setError("First name is required");
        setLoading(false);
        return;
      }

      if (!formData.lastName.trim()) {
        setError("Last name is required");
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      if (!isPasswordValid) {
        setError("Password does not meet all requirements");
        setLoading(false);
        return;
      }

      if (!passwordMatch) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const allQuestionsAnswered = formData.securityQuestions.every(
        (q) => q.questionIndex !== null && q.answer.trim().length >= 3
      );

      if (!allQuestionsAnswered) {
        setError(
          "All security questions must be answered with at least 3 characters"
        );
        setLoading(false);
        return;
      }

      // Normalize email and call backend register API
      const normalizedEmail = formData.email.trim().toLowerCase();
      const desiredRole = formData.role;

      const response = await authService.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: normalizedEmail,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: desiredRole,
        securityQuestions: formData.securityQuestions,
      });

      if (response.data.success) {
        let finalMessage = "Account created successfully";

        // If role is not STUDENT, update role using admin endpoint
        if (desiredRole !== "STUDENT" && token) {
          try {
            const usersResp = await userService.getAllUsers(token);
            const users = usersResp.data?.users || [];
            const createdUser = users.find(
              (u) => (u.email || "").toLowerCase() === normalizedEmail
            );

            if (createdUser && createdUser._id) {
              await userService.updateUserRole(createdUser._id, desiredRole, token);
              finalMessage = `Account created and role set to ${desiredRole.toLowerCase()}`;
            } else {
              finalMessage = "Account created, but could not locate user for role update";
            }
          } catch (roleErr) {
            console.error("Role update failed:", roleErr);
            finalMessage = "Account created, but role update failed";
          }
        }

        setSuccess(finalMessage + "!");
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "STUDENT",
          securityQuestions: [
            { questionIndex: null, answer: "" },
            { questionIndex: null, answer: "" },
            { questionIndex: null, answer: "" },
          ],
        });
        setPasswordRequirements({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        });
        setPasswordMatch(false);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/admin/user-management");
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Account creation failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <Layout user={user}>
      {success && (
        <div className={accountStyles.successOverlay}>
          <div className={accountStyles.successContent}>
            <div className={accountStyles.successIcon}>✓</div>
            <h2 className={accountStyles.successTitle}>
              Account Created Successfully!
            </h2>
            <p className={accountStyles.successMessage}>{success}</p>
          </div>
        </div>
      )}
      <div className={styles.createAccountContainer}>
        <div className={styles.createAccountCard}>
          {/* Header */}
          <div className={styles.header}>
            <button
              className={styles.backButton}
              onClick={() => navigate("/admin/dashboard")}
              aria-label="Go back"
            >
              <span className={styles.backButtonIcon}>←</span>
              Back
            </button>
            <div>
              <h1 className={styles.title}>Create Account</h1>
              <p className={styles.subtitle}>Create a new user account</p>
            </div>
          </div>

          
          {/* Error Alert */}
          {error && <div className={styles.errorAlert}>{error}</div>}

          {/* Create Account Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Role Selection */}
            <div className={styles.formGroup}>
              <label htmlFor="role" className={styles.label}>
                User Role <span className={styles.required}>*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={styles.select}
                disabled={loading}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className={styles.roleHint}>
                Select the role for this new account
              </p>
            </div>

            {/* First Name & Last Name Row */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName" className={styles.label}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName" className={styles.label}>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className={styles.input}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="Enter password"
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
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password Requirements Checklist */}
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

            {/* Confirm Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm password"
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
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password Match Indicator */}
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

            {/* Security Questions Section */}
            <div className={styles.securityQuestionsSection}>
              <h3 className={styles.sectionTitle}>Security Questions</h3>
              <p className={styles.sectionSubtitle}>
                Set 3 security questions for account recovery
              </p>

              {formData.securityQuestions.map((question, index) => (
                <div key={index} className={styles.securityQuestionGroup}>
                  <label className={styles.label}>
                    Security Question {index + 1}
                    <span className={styles.required}>*</span>
                  </label>

                  {/* Question Dropdown */}
                  <select
                    value={question.questionIndex ?? ""}
                    onChange={(e) =>
                      handleSecurityQuestionChange(
                        index,
                        e.target.value === "" ? null : parseInt(e.target.value)
                      )
                    }
                    className={styles.select}
                    disabled={loading}
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

                  {/* Answer Input */}
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
                          placeholder="Enter your answer"
                          className={styles.input}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            toggleSecurityAnswerVisibility(index)
                          }
                          className={styles.eyeButton}
                          disabled={loading}
                          aria-label={
                            showSecurityAnswers[index]
                              ? "Hide answer"
                              : "Show answer"
                          }
                        >
                          {showSecurityAnswers[index] ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p className={styles.answerHint}>
                        {question.answer.length < 3 &&
                        question.answer.length > 0
                          ? `${3 - question.answer.length} more character(s) needed`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || questionsLoading || !isPasswordValid || !passwordMatch}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
