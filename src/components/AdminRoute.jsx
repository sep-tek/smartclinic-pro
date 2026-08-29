import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not an admin
  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin
  return children;
}

export default AdminRoute;