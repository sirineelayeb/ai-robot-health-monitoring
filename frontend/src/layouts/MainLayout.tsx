import React, { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  AlertTriangle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Brain,
  Users,
  Settings,
  Wrench,
  Shield,
  BarChart3,
} from "lucide-react";
import { AlertDropdown } from "../components/panels/AlertDropdown";
import { useAuthContext } from "../context/useAuthContext";
import { initSocket } from "../services/socket";
import { Socket } from "socket.io-client";
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { useAuth } from "../context/useAuth";

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  description: string;
  badge?: string;
  roles?: ("admin" | "maintenance_engineer")[];
}

interface Alert {
  status: "CRITICAL" | "WARNING" | "INFO" | "RESOLVED";
  [key: string]: any;
}

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const { state: { user, isLoading }, dispatch } = useAuthContext();
  const { logout } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Get user role - only maintenance_engineer for engineers
  const userRole = user?.role;
  const isAdmin = userRole === "admin";
  const isEngineer = userRole === "maintenance_engineer";

  // Define navigation items based on role
  const getMenuItems = (): MenuItem[] => {
    // Common items for both roles
    const commonItems: MenuItem[] = [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        description: isAdmin ? "Admin control panel" : "Maintenance overview",
        badge: "Live",
      },
      {
        title: "Alerts",
        icon: AlertTriangle,
        path: "/alerts",
        description: "Anomaly notifications",
      },
      {
        title: "History",
        icon: History,
        path: "/history/robot_001", // Shared between both roles
        description: "Historical telemetry and analytics",
      },
    ];

    // Admin-only items
    if (isAdmin) {
      commonItems.push(
        {
          title: "Engineer Management",
          icon: Users,
          path: "/admin/engineers",
          description: "Manage maintenance staff",
          roles: ["admin"],
        },
        // {
        //   title: "Configuration",
        //   icon: Settings,
        //   path: "/admin/configuration",
        //   description: "Manage system thresholds",
        //   roles: ["admin"],
        //   badge: "New",
        // }
      );
    }

    // Engineer-only items (if you want to keep some exclusive to engineers)
    if (isEngineer) {
      // You can add engineer-specific items here if needed
      // For example:
      /*
      commonItems.push({
        title: "Maintenance Tasks",
        icon: Wrench,
        path: "/engineer/tasks",
        description: "Assigned maintenance work",
        roles: ["maintenance_engineer"],
      });
      */
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  const isActive = useCallback((path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    socketRef.current?.disconnect();
    navigate("/login", { replace: true });
    toast.success("Logged out successfully");
  };

  const handleViewAllAlerts = () => {
    navigate("/alerts");
  };

const calculateActiveAlerts = useCallback((): number => {
  try {
    const saved = localStorage.getItem('robot_alerts_history');
    if (saved) {
      const alerts: Alert[] = JSON.parse(saved);
      return alerts.filter((alert: Alert) => 
        alert.status === "CRITICAL" || alert.status === "WARNING"
      ).length;
    }
  } catch (err) {
    console.error("Failed to load alerts count:", err);
  }
  return 0;
}, []); // Empty dependency array - function won't change

// Update active alerts count
useEffect(() => {
  setActiveAlertsCount(calculateActiveAlerts());
  
  const interval = setInterval(() => {
    const newCount = calculateActiveAlerts();
    setActiveAlertsCount(prev => newCount !== prev ? newCount : prev);
  }, 5000);

  return () => clearInterval(interval);
}, [calculateActiveAlerts]);

// Socket connection management - FIXED
useEffect(() => {
  const socket = initSocket();
  if (!socket) {
    console.error("❌ Socket initialization failed");
    return;
  }

  socketRef.current = socket;
  
  // Set initial connection state
  setIsSocketConnected(socket.connected);

  const handleConnect = () => {
    console.log("✅ Socket connected");
    setIsSocketConnected(true);
    toast.success("Connected to real-time updates");
  };

  const handleDisconnect = () => {
    console.log("⚠️ Socket disconnected");
    setIsSocketConnected(false);
    toast.error("Disconnected from server");
  };

  const handleThresholdAlert = () => {
    // Update alert count when new alerts come in
    const newCount = calculateActiveAlerts();
    setActiveAlertsCount(newCount);
  };

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("threshold_alert", handleThresholdAlert);

  // If not connected, try to connect
  if (!socket.connected) {
    console.log("🔌 Socket not connected, attempting to connect...");
    socket.connect();
  }

  return () => {
    console.log("🧹 Cleaning up socket connection");
    if (socket) {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("threshold_alert", handleThresholdAlert);
      // Only disconnect if component unmounts, not on re-renders
    }
  };
}, []); // EMPTY dependency array - socket only initializes once

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between shadow-sm">
        {/* Logo + App Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent leading-tight">
              ROBOHEALTH
            </span>
            <span className="text-xs font-medium text-gray-700 -mt-1 tracking-wider">
              {isAdmin ? "ADMIN" : isEngineer ? "ENGINEER" : "MONITOR"}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isSocketConnected
                  ? "bg-green-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-500 hidden sm:inline">
              {isSocketConnected ? "Live" : "Offline"}
            </span>
          </div>

          {/* Alerts */}
          <AlertDropdown
            robotId="robot_001"
            onViewAll={handleViewAllAlerts}
          />

          {/* Menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen flex flex-col bg-gradient-to-b from-white to-gray-50/95 backdrop-blur-sm border-r border-gray-200/50 z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-72 lg:w-80
          shadow-xl
        `}
      >
        {/* Logo Section */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-gray-200/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex flex-col">
                <h1 className="font-black text-gray-900 text-xl tracking-tight bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  ROBOHEALTH
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isSocketConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className="text-xs font-medium text-gray-700 tracking-wide">
                    {isAdmin ? "ADMIN PANEL" : "ENGINEER PANEL"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop AlertDropdown */}
          <div className="hidden lg:block">
            <AlertDropdown robotId="robot_001" onViewAll={handleViewAllAlerts} />
          </div>
        </div>

        {/* Navigation - Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <nav className="py-6 px-4">
            {/* User Info */}
            <div className="mb-6 px-3">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${
                  isAdmin 
                    ? "bg-gradient-to-br from-purple-500 to-blue-500" 
                    : "bg-gradient-to-br from-green-500 to-emerald-500"
                }`}>
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-white" />
                  ) : (
                    <Wrench className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? "Administrator" : "Maintenance Engineer"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Navigation
              </h3>
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  // Check role permissions
                  if (item.roles && userRole && !item.roles.includes(userRole)) {
                    return null;
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group flex items-center justify-between px-3 py-3 rounded-xl
                        transition-all duration-200
                        ${
                          active
                            ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-600"
                            : "hover:bg-gray-100/80 border-l-4 border-transparent"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-9 h-9 rounded-lg flex items-center justify-center
                          ${active 
                            ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md" 
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                          }
                        `}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`font-medium text-sm ${
                                active ? "text-blue-700" : "text-gray-900"
                              }`}
                            >
                              {item.title}
                            </p>
                            {item.badge && (
                              <span className="text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 py-0.5 rounded-full shadow-sm">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${
                            active ? "text-blue-500" : "text-gray-500"
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${
                        active ? "text-blue-600" : "text-gray-400"
                      }`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="px-3 mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                System Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">Active Alerts</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">{activeAlertsCount}</span>
                    {activeAlertsCount > 0 && (
                      <span className="text-xs text-red-600 animate-pulse">•</span>
                    )}
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold ${
                      isSocketConnected ? "text-green-600" : "text-red-600"
                    }`}>
                      {isSocketConnected ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role-specific badge */}
            <div className="px-3 mb-6">
              <div className={`rounded-xl p-4 text-white shadow-lg ${
                isAdmin 
                  ? "bg-gradient-to-r from-purple-900 to-blue-900" 
                  : "bg-gradient-to-r from-green-900 to-emerald-900"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {isAdmin ? "Administrator Access" : "Engineer Access"}
                  </span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAdmin 
                      ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-purple-300" 
                      : "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300"
                  }`}>
                    {isAdmin ? "Admin" : "Engineer"}
                  </div>
                </div>
                <p className="text-xs text-gray-300">
                  {isAdmin 
                    ? "Full system control, user management, and analytics" 
                    : "Maintenance tasks, robot monitoring, and analytics"}
                </p>
              </div>
            </div>
          </nav>
        </div>

        {/* User Section - Fixed at bottom */}
        <div className="border-t border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${
              isAdmin 
                ? "bg-gradient-to-br from-purple-500 to-blue-500" 
                : "bg-gradient-to-br from-green-500 to-emerald-500"
            }`}>
              {isAdmin ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <Wrench className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isAdmin ? "Administrator" : "Maintenance Engineer"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg transition-all duration-200 text-sm font-medium text-gray-700 hover:shadow-sm border border-gray-300/50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-80">
        <main className="min-h-screen pt-16 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;