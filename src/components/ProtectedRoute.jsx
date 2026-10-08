import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_DESTINATIONS = {
  patient: "/dashboard",
  doctor: "/dashboard",
  admin: "/admin/dashboard",
};

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={ROLE_DESTINATIONS[user.role] || "/login"}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
