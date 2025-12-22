import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuthContext();
  const token = state?.accessToken || localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
