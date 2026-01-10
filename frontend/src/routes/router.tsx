// router/index.tsx
import { useRoutes, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/AdminDashboard";
import EngineerDashboard from "../pages/EngineerDashboard";
import TelemetryHistoryPage from "../pages/TelemetryHistoryPage";
import AlertsPage from "../pages/AlertsPage";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";

// Engineer Management Pages
import EngineerListPage from "../pages/admin/EngineerListPage";
import CreateEngineerPage from "../pages/admin/CreateEngineerPage";
import EditEngineerPage from "../pages/admin/EditEngineerPage";


const Router = () => {
  return useRoutes([
    /* =======================
       Public routes
    ======================= */
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },

    /* =======================
       Protected routes (Main Layout)
    ======================= */
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        // Redirect root to appropriate dashboard based on role
        { 
          index: true, 
          element: (
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          )
        },
        
        // Smart dashboard that shows content based on role
        { 
          path: "dashboard", 
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ) 
        },
        
        // Direct access to role-specific dashboards (optional fallback)
        { 
          path: "admin-dashboard", 
          element: (
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          ) 
        },
        { 
          path: "engineer-dashboard", 
          element: (
            <ProtectedRoute requireEngineer>
              <EngineerDashboard />
            </ProtectedRoute>
          ) 
        },
        
        // Shared pages
        { path: "alerts", element: <AlertsPage /> },
        { path: "history/:robotId", element: <TelemetryHistoryPage /> },
        
        // ========================
        // ADMIN ROUTES
        // ========================
        {
          path: "admin",
          children: [
            // Engineer Management
            {
              path: "engineers",
              element: (
                <ProtectedRoute requireAdmin>
                  <EngineerListPage />
                </ProtectedRoute>
              ),
            },
            {
              path: "engineers/create",
              element: (
                <ProtectedRoute requireAdmin>
                  <CreateEngineerPage />
                </ProtectedRoute>
              ),
            },
            {
              path: "engineers/:id/edit",
              element: (
                <ProtectedRoute requireAdmin>
                  <EditEngineerPage />
                </ProtectedRoute>
              ),
            },
          ],
        },
        
        // ========================
        // ENGINEER ROUTES
        // ========================
        {
          path: "engineer/tasks",
          element: (
            <ProtectedRoute requireEngineer>
              <div className="p-6">
                <h1 className="text-2xl font-bold">My Tasks</h1>
                <p className="text-gray-600 mt-2">Assigned maintenance tasks</p>
              </div>
            </ProtectedRoute>
          ),
        },
      ],
    },

    /* =======================
       Fallback
    ======================= */
    { path: "*", element: <Navigate to="/dashboard" replace /> },
  ]);
};

export default Router;