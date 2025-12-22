import { useRoutes, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Dashboard from "../pages/Dashboard";
import TelemetryHistoryPage from "../pages/TelemetryHistoryPage";
import ProtectedRoute from "./ProtectedRoute";

const Router = () => {
  return useRoutes([
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/history/:robotId",
      element: <TelemetryHistoryPage />,
    },
    {
      path: "/",
      element: <Navigate to="/login" replace />, 
    },
  ]);
};

export default Router;
