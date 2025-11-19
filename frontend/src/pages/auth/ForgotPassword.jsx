import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import styles from "./ForgotPassword.module.css";

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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" or "reset"
  const [userEmail, setUserEmail] = useState("");
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
    securityAnswers: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityAnswers, setShowSecurityAnswers] = useState([]);
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

  const handleEmailChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      email: value,
    }));
    if (error) setError("");
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.email.trim()) {
        setError("Email address is required");
        setLoading(false);
        return;
      }

      // Fetch user's security questions
      const response = await authService.getSecurityQuestionsForForgotPassword(
        formData.email.trim()
      );

      if (response.data.success && response.data.securityQuestions) {
        setUserEmail(formData.email.trim());
        setSecurityQuestions(response.data.securityQuestions);
        setShowSecurityAnswers(
          new Array(response.data.securityQuestions.length).fill(false)
        );
        setFormData((prev) => ({
          ...prev,
          securityAnswers: new Array(
            response.data.securityQuestions.length
          ).fill(""),
        }));
        setStep("reset");
      } else {
        setError("Email address not found");
      }
    } catch (err) {
      setError("Email address not found");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      newPassword: value,
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
    setPasswordMatch(formData.newPassword === value && value !== "");

    if (error) setError("");
  };

  const handleSecurityAnswerChange = (index, value) => {
    setFormData((prev) => {
      const newAnswers = [...prev.securityAnswers];
      newAnswers[index] = value;
      return {
        ...prev,
        securityAnswers: newAnswers,
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

  const isPasswordValid = Object.values(passwordRequirements).every(
    (req) => req
  );

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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

      // Check security answers are provided
      const allAnswersProvided = formData.securityAnswers.every(
        (answer) => answer.trim().length >= 3
      );

      if (!allAnswersProvided) {
        setError("Security question answers are required");
        setLoading(false);
        return;
      }

      // Call backend forgot password API
      const response = await authService.forgotPassword({
        email: userEmail,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
        securityAnswers: formData.securityAnswers,
      });

      if (response.data.success) {
        setSuccess("Redirecting to login...");
        setLoading(false);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/login", {
            state: { message: "Password reset successfully! Please log in." },
          });
        }, 3000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Security question answers are invalid";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setError("");
    setSecurityQuestions([]);
    setFormData((prev) => ({
      ...prev,
      newPassword: "",
      confirmPassword: "",
      securityAnswers: [],
    }));
    setPasswordRequirements({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });
    setPasswordMatch(false);
  };

  return (
    <div className={styles.forgotPasswordContainer}>
      {/* Success Popup Modal */}
      {success && (
        <div className={styles.successOverlay}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Password Reset Successfully!</h2>
            <p className={styles.successMessage}>{success}</p>
          </div>
        </div>
      )}

      <div className={styles.forgotPasswordCard}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>
            {step === "email"
              ? "Enter your email address to get started"
              : "Answer your security questions and set a new password"}
          </p>
        </div>

        {/* Error Alert */}
        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Email Step */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                className={styles.input}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
        )}

        {/* Reset Step */}
        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className={styles.form}>
            {/* Security Questions Section */}
            <div className={styles.securityQuestionsSection}>
              <h3 className={styles.sectionTitle}>
                Answer Your Security Questions
              </h3>

              {securityQuestions.map((question, index) => (
                <div key={index} className={styles.securityQuestionGroup}>
                  <label className={styles.label}>{question.question}</label>

                  <div className={styles.answerWrapper}>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showSecurityAnswers[index] ? "text" : "password"}
                        value={formData.securityAnswers[index] || ""}
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
                  </div>
                </div>
              ))}
            </div>

            {/* New Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                New Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your new password"
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
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm your new password"
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

            {/* Buttons */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleBackToEmail}
                className={styles.backButton}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !isPasswordValid || !passwordMatch}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        {/* Login Link */}
        <div className={styles.loginSection}>
          <p className={styles.loginText}>
            Remember your password?{" "}
            <Link to="/login" className={styles.loginLink}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
