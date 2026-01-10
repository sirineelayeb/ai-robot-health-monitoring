import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireEngineer?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAdmin, 
  requireEngineer 
}: ProtectedRouteProps) => {
  const { state } = useAuthContext();
  
  // Show loading while checking auth
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!state.user) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = state.user.role;
  const isAdmin = userRole === "admin";
  const isEngineer = userRole === "maintenance_engineer";
  
  // Check role requirements
  if (requireAdmin && !isAdmin) {
    // If engineer tries to access admin route, redirect to dashboard
    if (isEngineer) {
      return <Navigate to="/dashboard" replace />;
    }
    // Otherwise go to login
    return <Navigate to="/login" replace />;
  }
  
  if (requireEngineer && !isEngineer) {
    // If admin tries to access engineer route, redirect to dashboard
    if (isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;