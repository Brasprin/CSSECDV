import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { userService } from "../../services/userService";
import styles from "./UserManagement.module.css";

export default function UserManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
      setUser(userData);
      fetchUsers(token);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchUsers = async (token) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAllUsers(token);
      if (response.data.success) {
        // Sort users alphabetically by lastName, then firstName
        const sortedUsers = response.data.users.sort((a, b) => {
          const lastNameCompare = a.lastName.localeCompare(b.lastName);
          if (lastNameCompare !== 0) return lastNameCompare;
          return a.firstName.localeCompare(b.firstName);
        });
        setUsers(sortedUsers);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleFilterChange = (newRole) => {
    setRoleFilter(newRole);
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "-";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "ADMIN":
        return styles.roleBadgeAdmin;
      case "TEACHER":
        return styles.roleBadgeTeacher;
      case "STUDENT":
        return styles.roleBadgeStudent;
      default:
        return styles.roleBadge;
    }
  };

  // Filter users by role and search query
  const filteredUsers = users.filter((u) => {
    const roleMatch = roleFilter === "ALL" || u.role === roleFilter;
    const searchMatch =
      searchQuery === "" ||
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return roleMatch && searchMatch;
  });

  if (loading && users.length === 0) {
    return (
      <Layout user={user}>
        <div className={styles.loading}>Loading users...</div>
      </Layout>
    );
  }

  if (!user) {
    return <div className={styles.loading}>Redirecting...</div>;
  }

  return (
    <Layout user={user}>
      <div className={styles.userContainer}>
        {/* Page Header */}
        <div className={styles.headerRow}>
          <button
            className={styles.backButton}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <span className={styles.backButtonIcon}>←</span>
            Back
          </button>
          <h2 className={styles.pageHeaderTitle}>User Management</h2>
        </div>

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={`${styles.filterGroup} ${styles.filterRow}`}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by Role:</label>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterBtn} ${
                    roleFilter === "ALL" ? styles.filterBtnActive : ""
                  }`}
                  onClick={() => handleRoleFilterChange("ALL")}
                >
                  All
                </button>
                <button
                  className={`${styles.filterBtn} ${
                    roleFilter === "ADMIN" ? styles.filterBtnActive : ""
                  }`}
                  onClick={() => handleRoleFilterChange("ADMIN")}
                >
                  Admin
                </button>
                <button
                  className={`${styles.filterBtn} ${
                    roleFilter === "TEACHER" ? styles.filterBtnActive : ""
                  }`}
                  onClick={() => handleRoleFilterChange("TEACHER")}
                >
                  Teacher
                </button>
                <button
                  className={`${styles.filterBtn} ${
                    roleFilter === "STUDENT" ? styles.filterBtnActive : ""
                  }`}
                  onClick={() => handleRoleFilterChange("STUDENT")}
                >
                  Student
                </button>
              </div>
            </div>

            <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
              <label className={styles.filterLabel} htmlFor="searchInput">
                Search:
              </label>
              <input
                id="searchInput"
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Users Count */}
        <div className={styles.usersInfo}>
          <p>
            Showing <strong>{filteredUsers.length}</strong> user
            {filteredUsers.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Users Table */}
        {users.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th className={styles.email}>Email</th>
                  <th className={styles.firstName}>First Name</th>
                  <th className={styles.lastName}>Last Name</th>
                  <th className={styles.role}>Role</th>
                  <th className={styles.lockUntil}>Lock Until</th>
                  <th className={styles.lastLoginAt}>Last Login</th>
                  <th className={styles.lastFailedLoginAt}>Last Failed Login</th>
                  <th className={styles.createdAt}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => (
                  <tr key={index}>
                    <td className={styles.email}>{u.email}</td>
                    <td className={styles.firstName}>{u.firstName}</td>
                    <td className={styles.lastName}>{u.lastName}</td>
                    <td className={styles.role}>
                      <span className={getRoleBadgeClass(u.role)}>
                        {u.role}
                      </span>
                    </td>
                    <td className={styles.lockUntil}>
                      {u.lockUntil ? (
                        <span className={styles.lockUntilBadge}>
                          {formatDate(u.lockUntil)}
                        </span>
                      ) : (
                        <span className={styles.lockUntilNone}>None</span>
                      )}
                    </td>
                    <td className={styles.lastLoginAt}>
                      {formatDate(u.lastLoginAt)}
                    </td>
                    <td className={styles.lastFailedLoginAt}>
                      {formatDate(u.lastFailedLoginAt)}
                    </td>
                    <td className={styles.createdAt}>
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No users found for the selected filter.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
