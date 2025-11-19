import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { userService } from "../../services/userService";
import { authService } from "../../services/authService";
import styles from "../auth/Register.module.css";
import settingsStyles from "./AccountSettings.module.css";

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

export default function AccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [successType, setSuccessType] = useState(""); // "profile" or "password"
  const [securityQuestionPool, setSecurityQuestionPool] = useState([]);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Change password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      setProfileData({
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      fetchSecurityQuestions(token);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/login");
    }
    setLoading(false);
  }, [navigate]);

  const fetchSecurityQuestions = async (token) => {
    try {
      const response = await authService.getSecurityQuestions();
      if (response.data && Array.isArray(response.data)) {
        setSecurityQuestionPool(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch security questions:", err);
    }
  };

  // Profile handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    const token = localStorage.getItem("accessToken");
    setProfileLoading(true);

    try {
      const response = await userService.updateProfile(
        profileData.firstName,
        profileData.lastName,
        token
      );

      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSuccess("Profile updated successfully!");
        setSuccessType("profile");
        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
          setSuccessType("");
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Password handlers
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));

    if (name === "newPassword") {
      const newReqs = {};
      PASSWORD_REQUIREMENTS.forEach((req) => {
        newReqs[req.id] = req.regex.test(value);
      });
      setPasswordRequirements(newReqs);
      setPasswordMatch(value === passwordData.confirmPassword && value !== "");
    }

    if (name === "confirmPassword") {
      setPasswordMatch(passwordData.newPassword === value && value !== "");
    }

    if (error) setError("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!Object.values(passwordRequirements).every(Boolean)) {
      setError("New password does not meet all requirements");
      return;
    }

    if (!passwordMatch) {
      setError("Passwords do not match");
      return;
    }

    const token = localStorage.getItem("accessToken");
    setPasswordLoading(true);

    try {
      const response = await authService.changePassword(
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
          forceLogoutAllSessions: false,
        },
        token
      );

      if (response.data.success) {
        setSuccess("Redirecting to login...");
        setSuccessType("password");
        setPasswordLoading(false);

        // Clear tokens and redirect after 3 seconds
        setTimeout(() => {
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setSuccess(""); // Clear success message before navigation
          setSuccessType("");
          navigate("/login", {
            state: { message: "Password changed successfully! Please log in." },
          });
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password");
      setPasswordLoading(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      setError("Please type 'DELETE' to confirm account deletion");
      return;
    }

    const token = localStorage.getItem("accessToken");
    setDeleteLoading(true);

    try {
      const response = await userService.deleteAccount(token);

      if (response.data.success) {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login", {
          state: { message: "Account deleted successfully" },
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return <div className={styles.loading}>Redirecting...</div>;
  }

  return (
    <Layout user={user}>
      {/* Success Popup Modal - Only for password changes */}
      {success && successType === "password" && (
        <div className={settingsStyles.successOverlay}>
          <div className={settingsStyles.successContent}>
            <div className={settingsStyles.successIcon}>✓</div>
            <h2 className={settingsStyles.successTitle}>
              Password Changed Successfully!
            </h2>
            <p className={settingsStyles.successMessage}>{success}</p>
          </div>
        </div>
      )}

      <div className={settingsStyles.settingsContainer}>
        <div className={settingsStyles.settingsCard}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>Account Settings</h1>
            <p className={styles.subtitle}>Manage your account and security</p>
          </div>

          {/* Error/Success Messages */}
          {error && <div className={styles.errorAlert}>{error}</div>}
          {success && successType === "profile" && (
            <div className={settingsStyles.successAlert}>{success}</div>
          )}

          {/* Tabs */}
          <div className={settingsStyles.tabsContainer}>
            <button
              className={`${settingsStyles.tab} ${
                activeTab === "profile" ? settingsStyles.tabActive : ""
              }`}
              onClick={() => {
                setActiveTab("profile");
                setError("");
                setSuccess("");
              }}
            >
              Profile
            </button>
            <button
              className={`${settingsStyles.tab} ${
                activeTab === "password" ? settingsStyles.tabActive : ""
              }`}
              onClick={() => {
                setActiveTab("password");
                setError("");
                setSuccess("");
              }}
            >
              Change Password
            </button>
            <button
              className={`${settingsStyles.tab} ${
                activeTab === "delete" ? settingsStyles.tabActive : ""
              }`}
              onClick={() => {
                setActiveTab("delete");
                setError("");
                setSuccess("");
              }}
            >
              Delete Account
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.label}>
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className={styles.input}
                    disabled={profileLoading}
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
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className={styles.input}
                    disabled={profileLoading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  value={user.email}
                  className={styles.input}
                  disabled
                />
                <p className={settingsStyles.hint}>Email cannot be changed</p>
              </div>

              <div className={styles.formRow}>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => navigate(-1)}
                  disabled={profileLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={profileLoading}
                >
                  {profileLoading ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword" className={styles.label}>
                  Current Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter current password"
                    className={styles.input}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    className={styles.eyeButton}
                    disabled={passwordLoading}
                  >
                    {showPasswords.current ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  New Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    className={styles.input}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                    className={styles.eyeButton}
                    disabled={passwordLoading}
                  >
                    {showPasswords.new ? "Hide" : "Show"}
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
                      <span className={styles.requirementText}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm new password"
                    className={styles.input}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className={styles.eyeButton}
                    disabled={passwordLoading}
                  >
                    {showPasswords.confirm ? "Hide" : "Show"}
                  </button>
                </div>

                {passwordData.confirmPassword && (
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

              {/* Security questions removed: only current password required */}

              <div className={styles.formRow}>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => navigate(-1)}
                  disabled={passwordLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={
                    passwordLoading ||
                    !Object.values(passwordRequirements).every(Boolean) ||
                    !passwordMatch
                  }
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          )}

          {/* Delete Account Tab */}
          {activeTab === "delete" && (
            <div className={settingsStyles.deleteSection}>
              <div className={settingsStyles.deleteWarning}>
                <h3>Delete Account</h3>
                <p>
                  This action is permanent and cannot be undone. All your data
                  will be deleted.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deleteConfirm" className={styles.label}>
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  id="deleteConfirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                  className={styles.input}
                  disabled={deleteLoading}
                />
              </div>

              <div
                className={styles.formRow}
                style={{ marginTop: "24px" }} // ← pushes DELETE section downward
              >
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => navigate(-1)}
                  disabled={deleteLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className={settingsStyles.deleteButton}
                  disabled={deleteLoading || deleteConfirm !== "DELETE"}
                >
                  {deleteLoading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
