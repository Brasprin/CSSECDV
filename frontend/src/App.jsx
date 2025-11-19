import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AuditLogs from "./pages/admin/AuditLogs";
import UserManagement from "./pages/admin/UserManagement";
import UserRole from "./pages/admin/UserRole";
import AccountSettings from "./pages/shared/AccountSettings";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminResetUser from "./pages/admin/AdminResetUser";
import CreateCourse from "./pages/teacher/CreateCourse";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Dashboard Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
        <Route path="/admin/user-management/:userId/reset-password" element={<AdminResetUser />} />
        <Route path="/admin/user-roles" element={<UserRole />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/courses/new" element={<CreateCourse />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 Fallback */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}
