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
import CreateAccount from "./pages/admin/CreateAccount";
import AccountSettings from "./pages/shared/AccountSettings";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";

import BrowseCourses from "./pages/student/BrowseCourses";
import MyStudentCourses from "./pages/student/MyStudentCourses";
import AdminResetUser from "./pages/admin/AdminResetUser";
import CreateCourse from "./pages/teacher/CreateCourse";
import MyCourses from "./pages/teacher/MyCourses";
import StudentManagement from "./pages/teacher/StudentManagement";
import GradeStudents from "./pages/teacher/GradeStudents";
import MyGrades from "./pages/student/MyGrades";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./pages/shared/ErrorPage";
import { RequireAuth, RequireRole } from "./components/RouteGuards";

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Dashboard Routes with guards */}
        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN"]}>
                <AdminDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN"]}>
                <AuditLogs />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/user-management"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN"]}>
                <UserManagement />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/user-management/:userId/reset-password"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN"]}>
                <AdminResetUser />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/user-roles"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN"]}>
                <UserRole />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/create-account"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN"]}>
                <CreateAccount />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/account-settings"
          element={
            <RequireAuth>
              {/* Any authenticated user */}
              <AccountSettings />
            </RequireAuth>
          }
        />

        <Route
          path="/teacher/dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["TEACHER"]}>
                <TeacherDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/courses/new"
          element={
            <RequireAuth>
              <RequireRole roles={["TEACHER"]}>
                <CreateCourse />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <RequireAuth>
              <RequireRole roles={["TEACHER"]}>
                <MyCourses />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <RequireAuth>
              <RequireRole roles={["TEACHER"]}>
                <StudentManagement />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/grade"
          element={
            <RequireAuth>
              <RequireRole roles={["TEACHER"]}>
                <GradeStudents />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["STUDENT"]}>
                <StudentDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/student/browse-courses"
          element={
            <RequireAuth>
              <RequireRole roles={["STUDENT"]}>
                <BrowseCourses />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/student/my-courses"
          element={
            <RequireAuth>
              <RequireRole roles={["STUDENT"]}>
                <MyStudentCourses />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/student/my-grades"
          element={
            <RequireAuth>
              <RequireRole roles={["STUDENT"]}>
                <MyGrades />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Generic error page route */}
        <Route path="/error" element={<ErrorPage />} />

        {/* 404 Fallback */}
        <Route path="*" element={<ErrorPage />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
