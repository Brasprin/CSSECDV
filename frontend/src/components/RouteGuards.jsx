import React from "react";
import { useLocation } from "react-router-dom";
import ErrorPage from "../pages/shared/ErrorPage";

// Require the user to be authenticated; otherwise navigate to /login
export function RequireAuth({ children }) {
  const location = useLocation();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const userStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;

  if (!token || !userStr) {
    // Unauthenticated access: show error page with Go Back option
    return <ErrorPage />;
  }
  return children;
}

// Require the user to have one of the allowed roles; show ErrorPage if not
export function RequireRole({ roles, children }) {
  const userStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;

  if (!userStr) {
    // Not authenticated (handled by RequireAuth typically)
    return children;
  }

  let userRole = null;
  try {
    const user = JSON.parse(userStr);
    userRole = user?.role;
  } catch {
    // Parsing issue; treat as unauthorized
    userRole = null;
  }

  if (!roles.includes(userRole)) {
    // Show a generic error page design instead of throwing
    return <ErrorPage />;
  }

  return children;
}
