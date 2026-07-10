import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const userStr = localStorage.getItem("scm_currentUser");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem("scm_token");

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
