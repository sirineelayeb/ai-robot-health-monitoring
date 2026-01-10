import React from "react";
import { useAuthContext } from "../context/useAuthContext";
import AdminDashboard from "../pages/AdminDashboard";
import EngineerDashboard from "../pages/EngineerDashboard";

const Dashboard: React.FC = () => {
  const { state } = useAuthContext();

  // Show loading while checking auth
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user, this should be caught by ProtectedRoute
  if (!state.user) {
    return null;
  }

  // Render role-specific dashboard content
  const userRole = state.user.role;
  
  if (userRole === "admin") {
    return <AdminDashboard />;
  } else if (userRole === "maintenance_engineer") {
    return <EngineerDashboard />;
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Welcome, <span className="font-semibold text-blue-600">{state.user.name}</span>!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Role</h3>
              <p className="text-blue-700">{userRole}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Status</h3>
              <p className="text-green-700">Active</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Access</h3>
              <p className="text-purple-700">Authorized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;