import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (!lockUntil) return;

    // Calculate and set initial remaining time immediately
    const now = new Date();
    const remaining = Math.ceil((new Date(lockUntil) - now) / 1000);

    if (remaining <= 0) {
      setLockUntil(null);
      setRemainingTime(0);
      setError("");
      return;
    }

    setRemainingTime(remaining);

    // Set up interval for subsequent updates
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.ceil((new Date(lockUntil) - now) / 1000);

      if (remaining <= 0) {
        setLockUntil(null);
        setRemainingTime(0);
        setError("");
        clearInterval(interval);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      if (!formData.password) {
        setError("Password is required");
        setLoading(false);
        return;
      }

      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.data.success) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        const userRole = response.data.user.role;
        if (userRole === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (userRole === "TEACHER") {
          navigate("/teacher/dashboard");
        } else if (userRole === "STUDENT") {
          navigate("/student/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage =
        errorData?.error || "Login failed. Please try again.";

      // Check if account is locked
      if (errorData?.lockUntil) {
        setLockUntil(errorData.lockUntil);
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <div>{error}</div>
            {lockUntil && remainingTime > 0 && (
              <div className={styles.timeRemaining}>
                Time Remaining: <strong>{remainingTime}s</strong>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={styles.input}
              disabled={loading || lockUntil}
              autoComplete="email"
            />
          </div>

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
                onChange={handleChange}
                placeholder="Enter your password"
                className={styles.input}
                disabled={loading || lockUntil}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.eyeButton}
                disabled={loading || lockUntil}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || lockUntil}
          >
            {loading
              ? "Signing in..."
              : lockUntil
              ? "Account Locked"
              : "Sign In"}
          </button>
        </form>

        <div className={styles.forgotPasswordSection}>
          <Link to="/forgot-password" className={styles.forgotPasswordLink}>
            Forgot password?
          </Link>
        </div>

        <div className={styles.registerSection}>
          <p className={styles.registerText}>
            Don't have an account?{" "}
            <Link to="/register" className={styles.registerLink}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
