import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  AlertTriangle, AlertCircle, Bell, CheckCircle,
  Clock, Battery, Thermometer, Cpu, X,
  ChevronRight, RefreshCw
} from "lucide-react";
import { initSocket } from "../../services/socket";
import { fetchRecentAlerts, type Alert } from "../../api/alerts";

interface AlertDropdownProps {
  robotId?: string;
  onViewAll?: () => void;
}

const ALERT_LIMIT = 5;
const ANIMATION_DURATION = 300;

export const AlertDropdown: React.FC<AlertDropdownProps> = ({
  robotId = "robot_001",
  onViewAll
}) => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [hasNew, setHasNew] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getAlertMessage = (alert: Alert): string => {
    return alert.issues[0]?.message || 
      (alert.status === "CRITICAL" ? "Critical issue detected" : "Warning detected");
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const loadAlertsFromAPI = async () => {
    try {
      setIsLoading(true);
      const recentAlerts = await fetchRecentAlerts(robotId, ALERT_LIMIT);
      setAlerts(recentAlerts);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      loadAlertsFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlertsFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('robot_alerts_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.slice(0, ALERT_LIMIT));
      }
    } catch (err) {
      console.error("Failed to load from localStorage:", err);
    }
  };

  useEffect(() => {
    loadAlertsFromAPI();
  }, []);

  useEffect(() => {
    const socketInstance = initSocket();
    if (!socketInstance) return;

    const handleConnect = () => {
      setSocketConnected(true);
      socketInstance.emit("join", `robot_${robotId}`);
      socketInstance.emit("subscribe", robotId);
    };

    const handleDisconnect = () => setSocketConnected(false);

    const handleThresholdAlert = (data: any) => {
      const filteredIssues = data.issues?.filter((issue: any) => {
        const message = issue.message || '';
        return !message.toLowerCase().includes('ml anomaly') && 
               !message.toLowerCase().includes('anomaly');
      }) || [];

      if (filteredIssues.length === 0) return;

      const newAlert: Alert = {
        id: data.telemetry_id || `alert-${Date.now()}`,
        robot_id: data.robot_id || robotId,
        timestamp: new Date(data.timestamp).toISOString(),
        status: data.severity || "WARNING",
        issues: filteredIssues,
        metrics: {
          battery_level: data.metrics?.battery_level || 0,
          temperature: data.metrics?.temperature || 0,
          cpu_load: data.metrics?.cpu_load || 0,
          velocity: data.metrics?.velocity || 0,
          motor_current: data.metrics?.motor_current || 0,
        }
      };

      setAlerts(prev => {
        const thirtySecondsAgo = Date.now() - 30000;
        const duplicate = prev.find(existing => 
          existing.issues[0]?.message === newAlert.issues[0]?.message &&
          new Date(existing.timestamp).getTime() > thirtySecondsAgo
        );
        if (duplicate) return prev;
        
        const newAlerts = [newAlert, ...prev].slice(0, ALERT_LIMIT);
        localStorage.setItem('robot_alerts_history', JSON.stringify(newAlerts));
        return newAlerts;
      });

      if (!open) {
        setHasNew(true);
        setTimeout(() => setHasNew(false), 5000);
      }

      if (Notification.permission === "granted" && !document.hasFocus()) {
        const title = data.severity === "CRITICAL" ? "🚨 Critical Alert" : "⚠️ Warning";
        const message = filteredIssues[0]?.message || "Alert detected";
        new Notification(title, { body: `Robot ${robotId}: ${message}` });
      }
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("threshold_alert", handleThresholdAlert);
    socketInstance.on("telemetry", (data: any) => {
      if (data.detected_issues?.length > 0) {
        handleThresholdAlert({
          robot_id: data.robot_id,
          issues: data.detected_issues,
          severity: data.status || "WARNING",
          telemetry_id: data._id,
          timestamp: data.timestamp,
          metrics: {
            battery_level: data.battery_level,
            temperature: data.temperature,
            cpu_load: data.cpu_load,
            velocity: data.velocity,
            motor_current: data.motor_current
          }
        });
      }
    });

    if (socketInstance.connected) handleConnect();
    if (Notification.permission === "default") Notification.requestPermission();

    return () => {
      if (socketInstance) {
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);
        socketInstance.off("threshold_alert", handleThresholdAlert);
        socketInstance.off("telemetry");
        if (socketInstance.connected) {
          socketInstance.emit("leave", `robot_${robotId}`);
          socketInstance.emit("unsubscribe", robotId);
        }
      }
    };
  }, [robotId, open]);

  useEffect(() => {
    if (open) {
      setHasNew(false);
      loadAlertsFromAPI();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 380;
    const padding = 16;

    let left = rect.left + rect.width / 2 - dropdownWidth / 2;
    if (left < padding) left = padding;
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - padding;
    }

    setPosition({ top: rect.bottom + 8, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && buttonRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          !buttonRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setOpen(false);
      setIsAnimating(false);
    }, ANIMATION_DURATION);
  };

  const handleToggle = () => {
    if (!open && !isAnimating) {
      setOpen(true);
    } else {
      handleClose();
    }
  };

  const handleRefresh = () => loadAlertsFromAPI();
  const clearAlert = (id: string) => setAlerts(prev => prev.filter(alert => alert.id !== id));
  const clearAllAlerts = () => {
    setAlerts([]);
    setHasNew(false);
  };

  const criticalCount = alerts.filter(a => a.status === "CRITICAL").length;
  const warningCount = alerts.filter(a => a.status === "WARNING").length;
  const totalCount = alerts.length;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`relative p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
          criticalCount > 0 ? 'bg-red-50 hover:bg-red-100 text-red-600' 
          : warningCount > 0 ? 'bg-amber-50 hover:bg-amber-100 text-amber-600' 
          : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
        }`}
        aria-label={`Alerts (${totalCount})`}
      >
        <Bell className={`w-5 h-5 transition-transform ${open ? 'rotate-12' : ''}`} />
        {totalCount > 0 && (
          <span className={`
            absolute -top-1 -right-1 min-w-[20px] h-[20px] text-xs font-semibold 
            rounded-full flex items-center justify-center shadow-sm
            ${criticalCount > 0 ? 'bg-red-600 text-white' 
              : warningCount > 0 ? 'bg-amber-500 text-white' 
              : 'bg-blue-600 text-white'}
          `}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
        {hasNew && !open && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white animate-ping" />
        )}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className={`fixed w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden transform transition-all duration-${ANIMATION_DURATION} ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{ 
            top: position.top, 
            left: position.left,
            maxHeight: "75vh",
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  criticalCount > 0 ? 'bg-red-100 text-red-600' 
                  : warningCount > 0 ? 'bg-amber-100 text-amber-600' 
                  : 'bg-green-100 text-green-600'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">Robot Alerts</h3>
                  <p className="text-xs text-gray-600">Robot {robotId}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                  socketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium">{socketConnected ? 'Live' : 'Offline'}</span>
                </div>
                
                <button
                  onClick={handleClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm font-semibold text-red-600">{criticalCount} Critical</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-sm font-semibold text-amber-600">{warningCount} Warning</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(75vh-180px)]">
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-900 font-medium text-base">Loading Alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-900 font-medium text-base">No Active Alerts</p>
                <p className="text-sm text-gray-500 mt-1 mb-4">All systems are operating normally</p>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="text-xs text-gray-400">
                    {socketConnected ? 'Listening for real-time alerts...' : 'Connection lost'}
                  </p>
                </div>
              </div>
            ) : (
              alerts.map((alert) => {
                const isCritical = alert.status === "CRITICAL";
                const Icon = isCritical ? AlertCircle : AlertTriangle;
                
                return (
                  <div
                    key={alert.id}
                    className={`relative group border-l-4 ${
                      isCritical ? 'border-l-red-500 bg-gradient-to-r from-red-50/80 to-red-50/40' 
                      : 'border-l-amber-500 bg-gradient-to-r from-amber-50/80 to-amber-50/40'
                    } p-4 border-b border-gray-100 last:border-b-0`}
                  >
                    <button
                      onClick={() => clearAlert(alert.id)}
                      className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex items-start gap-3 pr-6">
                      <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-900 text-sm leading-tight pr-2">
                            {getAlertMessage(alert)}
                          </p>
                          <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        
                        {/* Conditional Metrics Display - Only show if value > 0 */}
                        <div className="flex items-center gap-4 mb-3">
                          {/* Battery - only show if > 0 */}
                          {alert.metrics.battery_level > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Battery className={`w-3.5 h-3.5 ${
                                alert.metrics.battery_level < 20 ? 'text-red-500' : 
                                alert.metrics.battery_level < 50 ? 'text-amber-500' : 'text-green-500'
                              }`} />
                              <span className="font-medium">{alert.metrics.battery_level.toFixed(1)}%</span>
                            </div>
                          )}
                          
                          {/* Temperature - only show if > 0 */}
                          {alert.metrics.temperature > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Thermometer className={`w-3.5 h-3.5 ${
                                alert.metrics.temperature > 70 ? 'text-red-500' : 
                                alert.metrics.temperature > 60 ? 'text-amber-500' : 'text-blue-500'
                              }`} />
                              <span className="font-medium">{alert.metrics.temperature.toFixed(1)}°C</span>
                            </div>
                          )}
                          
                          {/* CPU Load - only show if > 0 */}
                          {alert.metrics.cpu_load > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Cpu className={`w-3.5 h-3.5 ${
                                alert.metrics.cpu_load > 90 ? 'text-red-500' : 
                                alert.metrics.cpu_load > 70 ? 'text-amber-500' : 'text-blue-500'
                              }`} />
                              <span className="font-medium">{alert.metrics.cpu_load.toFixed(1)}%</span>
                            </div>
                          )}
                          
                          {/* Velocity - only show if > 0 */}
                          {alert.metrics.velocity > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <div className="w-3.5 h-3.5 flex items-center justify-center">
                                <span className="text-xs">⚡</span>
                              </div>
                              <span className="font-medium">{alert.metrics.velocity.toFixed(1)} m/s</span>
                            </div>
                          )}
                          
                          {/* Motor Current - only show if > 0 */}
                          {alert.metrics.motor_current > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <div className="w-3.5 h-3.5 flex items-center justify-center">
                                <span className="text-xs">🔌</span>
                              </div>
                              <span className="font-medium">{alert.metrics.motor_current.toFixed(1)}A</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Issues List */}
                        {alert.issues.length > 0 && (
                          <div className="space-y-1.5">
                            {alert.issues.slice(0, 2).map((issue, idx) => (
                              <div 
                                key={idx} 
                                className={`text-xs pl-3 py-1.5 rounded-md ${
                                  issue.severity === 'CRITICAL' 
                                    ? 'bg-red-100/70 text-red-800 border border-red-200' 
                                    : 'bg-amber-100/70 text-amber-800 border border-amber-200'
                                }`}
                              >
                                <span className="font-medium">•</span> {issue.message}
                              </div>
                            ))}
                            {alert.issues.length > 2 && (
                              <div className="text-xs text-gray-500 pl-3">
                                +{alert.issues.length - 2} more issues
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {totalCount > 0 ? (
                <>
                  <button
                    onClick={clearAllAlerts}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium hover:underline"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      handleClose();
                      onViewAll?.();
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:gap-3 transition-all"
                  >
                    View All Alerts
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-center">
                  <p className="text-xs text-gray-500">
                    {socketConnected ? 'Monitoring robot systems...' : 'Reconnecting...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};