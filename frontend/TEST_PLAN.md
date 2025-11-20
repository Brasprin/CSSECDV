# SECDEV Frontend Demo Test Plan

## Overview
- Purpose: Demonstrate compliance of the frontend flows with the Secure Web Development Case Project Checklist using the existing backend.
- Scope: Frontend-only behavior using backend APIs. No backend modifications.
- Design alignment: Uses tokens defined in `frontend/src/styles/global.css`.
- Error UX:
  - `ErrorBoundary.jsx` handles unexpected render errors (application errors) without exposing debug/stack traces.
  - `ErrorPage.jsx` is used for route-level fallback and access control rejections.

## Environment and Seed Data
- Backend database is seeded using `backend/seed.js`.
- Default seeded users (all share password `password123`):
  - Admin: `admin@example.com` (role: `ADMIN`)
  - Teacher: `teacher1@example.com` (role: `TEACHER`)
  - Students: `student1@example.com`, `student2@example.com` (role: `STUDENT`)
- Courses seeded:
  - `CS101` section A (teacher: teacher1)
  - `CS202` section B (teacher: teacher1)
- Enrollment and grades present to support teacher/student dashboards.

## 1.0 Pre-demo Requirements

### 1.1 Accounts (at least 1 per type of user)
- Already present from seed:
  - Website Administrator: `admin@example.com` / `password123`
  - Role A (Teacher): `teacher1@example.com` / `password123`
  - Role B (Student): `student1@example.com` / `password123` and `student2@example.com` / `password123`

Verification:
- Attempt login as each role via `/login`. Successful login routes to role-specific dashboard:
  - Admin -> `/admin/dashboard`
  - Teacher -> `/teacher/dashboard`
  - Student -> `/student/dashboard`

## 2.0 Demo Requirements

### 2.1 Authentication

#### 2.1.1 Require authentication for all pages except public
- Public pages: `/login`, `/register`, `/forgot-password`.
- Guarded by `RequireAuth` in `App.jsx` for all dashboards and feature pages.
Test:
1. Ensure `localStorage` has no `accessToken`/`user`.
2. Navigate directly to `/admin/dashboard`, `/teacher/dashboard`, `/student/dashboard`.
3. Expect `ErrorPage` (unauthenticated) for each.

#### 2.1.2 Only cryptographically strong salted hashes of passwords are stored
- Evidence: `seed.js` uses `bcryptjs.hash("password123", 10)`.
- Demonstration: Reference code path; storage not visible in UI.

#### 2.1.3 Authentication failure responses do not reveal which field is wrong
- `Login.jsx` shows generic error from backend or "Login failed. Please try again.".
Test:
1. Wrong email or wrong password.
2. Expect generic failure, not indicating which field is incorrect.

#### 2.1.4 Password complexity requirements
- `Register.jsx` enforces: min 8 chars, uppercase, lowercase, number, special char.
- `ForgotPassword.jsx` enforces the same for reset.
Test:
1. Try a password violating any requirement.
2. Expect inline validation to block submission with "Password does not meet all requirements".

#### 2.1.5 Password length requirements
- Enforced via `/.{8,}/` rule.
Test:
1. Use 7-character password.
2. Expect validation fail.

#### 2.1.6 Password entry obscured on screen
- Password fields default to obscured; toggle with Show/Hide buttons.
Test:
1. Verify obscured input on Login, Register, Forgot Password.
2. Toggle visibility using eye buttons.

#### 2.1.7 Enforce account disabling after invalid attempts
- Backend logic; frontend surfaces backend errors.
Test:
1. Submit incorrect password ≥5 times.
2. Observe backend lockout message (if provided) displayed in the error area.
3. Confirm subsequent attempts fail during lockout period.

#### 2.1.8 Security questions with sufficiently randomizable answers
- `Register.jsx` requires 3 questions; answers require ≥3 characters.
- Question pool fetched via `authService.getSecurityQuestions()`.
Test:
1. Try proceeding without selecting all 3 questions or use short answers.
2. Expect error: "All security questions must be answered with at least 3 characters".
3. In Forgot Password, verify questions appear and answers are required.

#### 2.1.9 Prevent password re-use against user’s history
- Backend responsibility; frontend reflects backend error.
Test:
1. Attempt to change/reset to a previously-used password.
2. Expect backend error surfaced in UI.

#### 2.1.10 Passwords must be at least one day old before change
- Backend responsibility; frontend reflects backend error.
Test:
1. Immediately try to change password after registration.
2. Expect error from backend shown in UI.

#### 2.1.11 Show last account use at next successful login
- Backend responsibility; if provided by API, display or reference in UI.
Test:
1. Log in and verify any "last use" info is shown if backend responds with it; otherwise evidence by API design.

#### 2.1.12 Re-authenticate users prior to critical operations
- Protected operations require `Authorization` header (e.g., `changePassword`).
- Route-level protection via `RequireAuth`.
Test:
1. Clear `accessToken` and attempt to access protected routes.
2. Expect `ErrorPage` (unauthenticated).

### 2.2 Authorization/Access Control

#### 2.2.1 Single site-wide component to check access authorization
- Centralized in `RouteGuards.jsx` (`RequireAuth`, `RequireRole`).
Test:
1. Confirm all protected routes in `App.jsx` are wrapped with guards.

#### 2.2.2 Access controls fail securely with error messages
- Unauthorized/unauthenticated access renders `ErrorPage` with generic messaging; no stack traces.

#### 2.2.3 Enforce application logic flows using RBAC
- `App.jsx` applies `RequireRole` to each role area.
Test:
1. Login as ADMIN:
   - Access Admin routes -> success
   - Access Teacher/Student routes -> `ErrorPage`
2. Login as TEACHER:
   - Access Teacher routes -> success
   - Access Admin/Student routes -> `ErrorPage`
3. Login as STUDENT:
   - Access Student routes -> success
   - Access Admin/Teacher routes -> `ErrorPage`

### 2.3 Data Validation

#### 2.3.1 All validation failures result in input rejection
- Register and Forgot Password reject invalid inputs and show explicit errors.
Test:
1. Leave required fields empty.
2. Expect error alert and no submission.

#### 2.3.2 Validate numeric ranges or allowed characters
- Frontend demonstrates allowed characters and lengths for passwords/answers; numeric ranges typically validated by backend (e.g., course capacity). Frontend surfaces backend validation errors in UI.

#### 2.3.3 Validate data length on text fields
- Register enforces ≥3 characters for security answers; password min length; Login requires non-empty fields.

### 2.4 Error Handling and Logging

#### 2.4.1 Error handlers do not display debugging or stack trace information
- `ErrorBoundary.jsx` shows generic overlay without stack traces.
- `ErrorPage.jsx` shows generic error messaging.
Test:
1. Simulate a rendering error (temporarily throw in a component during testing) to see ErrorBoundary overlay without stack traces.

#### 2.4.2 Implement generic error messages and custom error pages
- `ErrorPage` is used for routing/authorization errors.
- `ErrorBoundary` for runtime rendering errors.

#### 2.4.3 Restrict access to logs to only website administrators
- Frontend does not expose logs. Admin-only areas (e.g., Audit Logs page) require `ADMIN` via guards.
Test:
1. As non-admin, navigate to `/admin/audit-logs` -> `ErrorPage`.

#### 2.4.4 Log all input validation failures (backend)
- Frontend demonstrates by triggering validation failures and showing non-sensitive alerts. Back-end logs these events.

#### 2.4.5 Log all authentication attempts, both successful and failed, including lockout (backend)
- Demonstrate by performing successful and failed logins; frontend surfaces backend responses.

#### 2.4.6 Log all access control failures (backend)
- Demonstrate by attempting unauthorized navigation; frontend shows `ErrorPage` while backend records the failure.

---

## Role-Based Demo Script

### Admin
1. Login with `admin@example.com` / `password123`.
2. Land on `/admin/dashboard`.
3. Navigate to:
   - `/admin/audit-logs` (should load)
   - `/teacher/dashboard` (should show `ErrorPage`)
   - `/student/dashboard` (should show `ErrorPage`)
4. Logout (if UI available). Without tokens, visiting protected routes shows `ErrorPage`.

### Teacher
1. Login with `teacher1@example.com` / `password123`.
2. Land on `/teacher/dashboard`.
3. Navigate to:
   - `/teacher/courses`
   - `/teacher/grade`
   - `/admin/dashboard` (ErrorPage)
   - `/student/my-grades` (ErrorPage)

### Student
1. Login with `student1@example.com` / `password123`.
2. Land on `/student/dashboard`.
3. Navigate to:
   - `/student/browse-courses`
   - `/student/my-courses`
   - `/student/my-grades`
   - `/admin/dashboard` (ErrorPage)
   - `/teacher/dashboard` (ErrorPage)

---

## Authentication and Password Flows

### Registration
1. Go to `/register`.
2. Try invalid password -> blocked by checklist UI.
3. Complete registration with valid password + 3 security questions (≥3 chars each).
4. After success: redirected to `/login` with success message.

### Login
1. Go to `/login`.
2. Test wrong credentials -> generic error, no field specifics.
3. Test correct credentials for each role -> routed accordingly.

### Forgot Password
1. Go to `/forgot-password`.
2. Step 1: submit email.
3. Step 2: answer fetched security questions; provide valid new password meeting requirements; confirm password.
4. After success: success message then redirect to `/login`.

---

## Routing and Error Handling
- Unknown path: navigate to `/non-existent` -> `ErrorPage` (fallback route in `App.jsx`).
- Application crash: if any component throws during render, `ErrorBoundary` overlay appears with generic messaging; no stack traces.

---

## Implementation Notes
- LocalStorage keys used by the frontend: `accessToken`, `refreshToken`, `user`.
- Auth APIs: see `frontend/src/services/authService.js` (`/api/auth/*` endpoints).
- UI intentionally avoids sensitive error details; messages are generic.
- Backend validations (password reuse, password age, lockouts) are demonstrated by attempting the actions and showing backend-provided error messages in the UI.
