import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Preloader from "./Preloader";

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Preloader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && (!user || user.role !== role)) {
    const fallback = user?.role
      ? {
          patient: "/patient/dashboard",
          doctor: "/doctor/dashboard",
          admin: "/admin/dashboard",
          employee: "/employee/dashboard",
        }[user.role]
      : null;

    return <Navigate to={fallback || "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
