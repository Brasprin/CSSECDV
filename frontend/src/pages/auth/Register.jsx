import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import styles from "./Register.module.css";

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

export default function Register() {
  const navigate = useNavigate();
  const [securityQuestionPool, setSecurityQuestionPool] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // Fetch security questions on component mount
  useEffect(() => {
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
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      password: value,
    }));

    // Check password requirements
    const newRequirements = {};
    PASSWORD_REQUIREMENTS.forEach((req) => {
      newRequirements[req.id] = req.regex.test(value);
    });
    setPasswordRequirements(newRequirements);

    // Check if passwords match
    setPasswordMatch(value === formData.confirmPassword && value !== "");

    if (error) setError("");
  };

  const handleConfirmPasswordChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      confirmPassword: value,
    }));

    // Check if passwords match
    setPasswordMatch(formData.password === value && value !== "");

    if (error) setError("");
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
    setLoading(true);

    try {
      // Frontend validation - basic checks only
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

      // Check security questions are selected and answered
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

      // Call backend register API - backend will do all validation
      const response = await authService.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        securityQuestions: formData.securityQuestions,
      });

      if (response.data.success) {
        // Redirect to login with success message
        navigate("/login", {
          state: { message: "Registration successful! Please log in." },
        });
      }
    } catch (err) {
      // Backend validation errors
      const errorMessage =
        err.response?.data?.error || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join SecDEV today</p>
        </div>

        {/* Error Alert */}
        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* First Name & Last Name Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className={styles.input}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
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
              Confirm Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your password"
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
              Answer 3 security questions to help recover your account
            </p>

            {formData.securityQuestions.map((question, index) => (
              <div key={index} className={styles.securityQuestionGroup}>
                <label className={styles.label}>
                  Security Question {index + 1}
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
                    <option key={q.index} value={q.index} disabled={q.disabled}>
                      {q.question}
                    </option>
                  ))}
                </select>

                {/* Answer Input */}
                {question.questionIndex !== null && (
                  <div className={styles.answerWrapper}>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showSecurityAnswers[index] ? "text" : "password"}
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
                        onClick={() => toggleSecurityAnswerVisibility(index)}
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
                      {question.answer.length < 3 && question.answer.length > 0
                        ? `${
                            3 - question.answer.length
                          } more character(s) needed`
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
            disabled={loading || !isPasswordValid || !passwordMatch}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <div className={styles.loginSection}>
          <p className={styles.loginText}>
            Already have an account?{" "}
            <Link to="/login" className={styles.loginLink}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
