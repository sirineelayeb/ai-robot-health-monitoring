import React, { useState, useEffect, useCallback } from "react";
import { 
  AlertCircle, AlertTriangle, CheckCircle, RefreshCw,
  Clock, Battery, Thermometer, Cpu, Bell, Brain
} from "lucide-react";
import { fetchRecentAlerts, fetchAlertStats } from "../api/alerts"; // CHANGE THIS LINE
import type { Alert } from "../api/alerts";
import { initSocket } from "../services/socket";

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    critical: 0,
    warning: 0,
    total: 0,
    aiDetections: 0
  });

  const formatTime = useCallback((timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [alertsData, statsData] = await Promise.all([
        fetchRecentAlerts("robot_001", 50), // CHANGE THIS LINE - use fetchRecentAlerts
        fetchAlertStats()
      ]);
      
      console.log('AlertsPage loaded alerts:', alertsData);
      if (alertsData.length > 0) {
        console.log('First alert:', alertsData[0]);
        console.log('First alert issues:', alertsData[0].issues);
      }
      
      setAlerts(alertsData);
      setStats({
        critical: statsData.critical,
        warning: statsData.warning,
        total: statsData.total,
        aiDetections: alertsData.filter(a => 
          a.issues.some(i => i.message.includes('AI detected:'))
        ).length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const socket = initSocket();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("subscribe", "robot_001");
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleAlert = (data: any) => {
      const newAlert: Alert = {
        id: `socket-${Date.now()}`,
        robot_id: data.robot_id || "robot_001",
        timestamp: new Date().toISOString(),
        status: data.status === "CRITICAL" ? "CRITICAL" : "WARNING",
        issues: data.detected_issues?.map((issue: any) => ({
          message: issue.message,
          severity: issue.severity
        })) || [],
        metrics: {
          battery_level: data.battery_level || 0,
          temperature: data.temperature || 0,
          cpu_load: data.cpu_load || 0,
          velocity: data.velocity || 0,
          motor_current: data.motor_current || 0
        }
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 99)]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("threshold_alert", handleAlert);
    socket.on("anomaly_alert", handleAlert);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("threshold_alert", handleAlert);
      socket.off("anomaly_alert", handleAlert);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Alerts</h1>
                <p className="text-sm text-gray-600">Real-time monitoring for robot_001</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Alerts</div>
              </div>
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.warning}</div>
                <div className="text-sm text-gray-600">Warning</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.aiDetections}</div>
                <div className="text-sm text-gray-600">AI Detections</div>
              </div>
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Alerts Found</h3>
            <p className="text-gray-600">All systems are operating normally.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Alerts ({alerts.length})
            </h2>
            
            {alerts.slice(0, 20).map((alert) => {
              const isCritical = alert.status === "CRITICAL";
              const isAI = alert.issues.some(i => i.message.includes('AI detected:'));
              
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-lg border border-gray-200 border-l-4 ${
                    isCritical ? 'border-l-red-500' : 'border-l-amber-500'
                  } p-5`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {isAI ? (
                        <Brain className="w-5 h-5 text-purple-600" />
                      ) : (
                        isCritical ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {alert.issues.length > 0 
                              ? alert.issues[0].message 
                              : (alert.status === "CRITICAL" ? "Critical alert detected" : "Warning alert detected")}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isCritical ? 'CRITICAL' : 'WARNING'}
                            </span>
                            {isAI && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                AI Detection
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      
                      {/* Conditional Metrics - Only show if value > 0 */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {/* CPU Load */}
                        {alert.metrics.cpu_load > 0 && (
                          <span className="flex items-center gap-2">
                            <Cpu className={`w-4 h-4 ${
                              alert.metrics.cpu_load > 90 ? 'text-red-500' : 
                              alert.metrics.cpu_load > 70 ? 'text-amber-500' : 'text-blue-500'
                            }`} />
                            {alert.metrics.cpu_load.toFixed(1)}%
                          </span>
                        )}
                        
                        {/* Velocity */}
                        {alert.metrics.velocity > 0 && (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <span className="text-xs">⚡</span>
                            </div>
                            {alert.metrics.velocity.toFixed(1)} m/s
                          </span>
                        )}
                        
                        {/* Motor Current */}
                        {alert.metrics.motor_current > 0 && (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <span className="text-xs">🔌</span>
                            </div>
                            {alert.metrics.motor_current.toFixed(1)}A
                          </span>
                        )}
                        
                        {/* Battery */}
                        {alert.metrics.battery_level > 0 && (
                          <span className="flex items-center gap-2">
                            <Battery className={`w-4 h-4 ${
                              alert.metrics.battery_level < 20 ? 'text-red-500' : 
                              alert.metrics.battery_level < 50 ? 'text-amber-500' : 'text-green-500'
                            }`} />
                            {alert.metrics.battery_level.toFixed(1)}%
                          </span>
                        )}
                        
                        {/* Temperature */}
                        {alert.metrics.temperature > 0 && (
                          <span className="flex items-center gap-2">
                            <Thermometer className={`w-4 h-4 ${
                              alert.metrics.temperature > 70 ? 'text-red-500' : 
                              alert.metrics.temperature > 60 ? 'text-amber-500' : 'text-blue-500'
                            }`} />
                            {alert.metrics.temperature.toFixed(1)}°C
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {alerts.length > 20 && (
              <div className="text-center text-sm text-gray-600 pt-4">
                Showing 20 of {alerts.length} alerts
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;