// EngineerDashboard.tsx - SIMPLIFIED VERSION
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { 
  AlertTriangle, Battery, Cpu, RefreshCw,
  Thermometer, Shield, Loader2, CheckCircle,
  Wrench, Activity, AlertCircle,
  RadioTower, Brain, TrendingUp, Zap
} from "lucide-react";
import { getLatestTelemetry, getAnomalies } from "../api/telemetry";
import { initSocket } from "../services/socket";
import type { TelemetryData } from "../types/telemetry";
import { AIWarningsPanel } from "../components/panels/AIWarningsPanel";
import { useAuthContext } from "../context/useAuthContext";

const SELECTED_ROBOT = "robot_001";

export default function EngineerDashboard() {
  const { state } = useAuthContext();
  
  // State variables
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [anomalies, setAnomalies] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Simple filter
  const [showResolved, setShowResolved] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'ai'>('all');
  
  // Maintenance
  const [resolvedIssues, setResolvedIssues] = useState<string[]>([]);
  
  const socketRef = useRef<any>(null);

  // ============================
  // WebSocket Connection
  // ============================
  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;
    
    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("subscribe", SELECTED_ROBOT);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
    };
    
    const handleTelemetryUpdate = (data: TelemetryData) => {
      if (!data || data.robot_id !== SELECTED_ROBOT) return;
      
      setTelemetry(data);
      setLastUpdate(new Date());
      
      if (data.ml_prediction?.is_anomaly || data.status !== "NORMAL") {
        setAnomalies(prev => {
          const exists = prev.some(t => t._id === data._id);
          if (exists) {
            return prev.map(t => t._id === data._id ? data : t);
          }
          return [data, ...prev.slice(0, 99)];
        });
      }
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('telemetry', handleTelemetryUpdate);
    
    if (!socket.connected) socket.connect();
    else handleConnect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('telemetry', handleTelemetryUpdate);
      }
    };
  }, []);

  // ============================
  // Initial Data Fetch
  // ============================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [latest, anomaliesData] = await Promise.all([
        getLatestTelemetry(SELECTED_ROBOT),
        getAnomalies(SELECTED_ROBOT, { limit: 100 })
      ]);
      
      if (latest) {
        setTelemetry(latest);
        setAnomalies(anomaliesData);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load robot data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================
  // Maintenance Actions
  // ============================
  const handleResolveIssue = (alertId: string) => {
    if (!resolvedIssues.includes(alertId)) {
      setResolvedIssues(prev => [...prev, alertId]);
    }
  };

  const handleUndoResolve = (alertId: string) => {
    setResolvedIssues(prev => prev.filter(id => id !== alertId));
  };

  // ============================
  // Filtered Alerts
  // ============================
  const filteredAlerts = useMemo(() => {
    let filtered = anomalies;
    
    // Hide resolved if needed
    if (!showResolved) {
      filtered = filtered.filter(a => !resolvedIssues.includes(a._id));
    }
    
    // Apply filter
    switch (activeFilter) {
      case 'critical':
        return filtered.filter(a => a.status === "CRITICAL");
      case 'ai':
        return filtered.filter(a => a.ml_prediction?.is_anomaly === true);
      default:
        return filtered;
    }
  }, [anomalies, resolvedIssues, showResolved, activeFilter]);

  // ============================
  // Stats Calculation
  // ============================
  const stats = useMemo(() => {
    if (!telemetry) return null;

    const activeAlerts = anomalies.filter(a => !resolvedIssues.includes(a._id));
    const criticalCount = activeAlerts.filter(a => a.status === "CRITICAL").length;
    const aiCount = activeAlerts.filter(a => a.ml_prediction?.is_anomaly === true).length;
    
    const sensorHealth = [
      telemetry.encoder_ok,
      telemetry.lidar_ok,
      telemetry.camera_ok
    ].filter(Boolean).length;

    return { 
      criticalCount, 
      aiCount,
      sensorHealth,
      activeAlerts: activeAlerts.length,
      totalAlerts: anomalies.length,
      resolvedCount: resolvedIssues.length
    };
  }, [telemetry, anomalies, resolvedIssues]);

  // ============================
  // Loading & Error States
  // ============================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !telemetry || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">{error || "Unable to load data"}</p>
          <button 
            onClick={fetchData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // MAIN RENDER
  // ============================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wrench className="w-6 h-6 text-blue-600" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Maintenance Dashboard</h1>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-gray-700">
                      {SELECTED_ROBOT} • {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    Last update: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Engineer: <span className="font-medium">{state.user?.name || 'User'}</span>
                </span>
                <button
                  onClick={fetchData}
                  disabled={isRefreshing}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {stats.activeAlerts > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-bold text-red-800">Action Required</h3>
                  <p className="text-sm text-red-700">
                    {stats.activeAlerts} unresolved issue{stats.activeAlerts !== 1 ? 's' : ''} • 
                    {stats.criticalCount > 0 && ` ${stats.criticalCount} critical`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Health & Issues */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Health Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Robot Health</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Battery */}
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Battery className={`w-8 h-8 ${
                      telemetry.battery_level < 30 ? 'text-red-600' :
                      telemetry.battery_level < 50 ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{telemetry.battery_level}%</div>
                  <div className="text-sm text-gray-600">Battery</div>
                </div>

                {/* Temperature */}
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Thermometer className={`w-8 h-8 ${
                      telemetry.temperature > 70 ? 'text-red-600' :
                      telemetry.temperature > 50 ? 'text-orange-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{telemetry.temperature}°C</div>
                  <div className="text-sm text-gray-600">Temperature</div>
                </div>

                {/* CPU */}
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Cpu className={`w-8 h-8 ${
                      telemetry.cpu_load > 85 ? 'text-red-600' :
                      telemetry.cpu_load > 70 ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{telemetry.cpu_load}%</div>
                  <div className="text-sm text-gray-600">CPU</div>
                </div>

                {/* Sensors */}
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Shield className={`w-8 h-8 ${
                      stats.sensorHealth === 3 ? 'text-green-600' :
                      stats.sensorHealth >= 2 ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.sensorHealth}/3</div>
                  <div className="text-sm text-gray-600">Sensors</div>
                </div>
              </div>
            </div>

            {/* Active Issues */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="font-bold text-gray-900 text-lg">Active Issues</h2>
                  
                  <div className="flex items-center gap-2">
                    {/* Filter Buttons */}
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        activeFilter === 'all'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      All ({anomalies.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('critical')}
                      className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                        activeFilter === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Critical ({stats.criticalCount})
                    </button>
                    <button
                      onClick={() => setActiveFilter('ai')}
                      className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                        activeFilter === 'ai'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Brain className="w-4 h-4" />
                      AI ({stats.aiCount})
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-600">No active issues</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAlerts.slice(0, 10).map((alert) => {
                      const isResolved = resolvedIssues.includes(alert._id);
                      const isCritical = alert.status === 'CRITICAL';
                      const isAI = alert.ml_prediction?.is_anomaly;
                      
                      return (
                        <div 
                          key={alert._id}
                          className={`p-4 rounded-lg border ${
                            isResolved 
                              ? 'border-green-300 bg-green-50' 
                              : isCritical 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-yellow-300 bg-yellow-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                {isAI && (
                                  <Brain className="w-4 h-4 text-purple-600" />
                                )}
                                <span className={`font-medium ${
                                  isCritical ? 'text-red-700' : 'text-yellow-700'
                                }`}>
                                  {alert.ml_prediction?.anomaly_type || alert.anomaly_type || 'Issue'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </div>
                              <div className="flex gap-2 text-sm">
                                {alert.battery_level && (
                                  <span>Battery: {alert.battery_level}%</span>
                                )}
                                {alert.temperature && (
                                  <span>Temp: {alert.temperature}°C</span>
                                )}
                              </div>
                            </div>
                            
                            {!isResolved ? (
                              <button
                                onClick={() => handleResolveIssue(alert._id)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded text-sm"
                              >
                                Resolve
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUndoResolve(alert._id)}
                                className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredAlerts.length > 10 && (
                      <div className="text-center text-sm text-gray-600">
                        Showing 10 of {filteredAlerts.length} issues
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Warnings */}
            <AIWarningsPanel 
              telemetryList={anomalies.filter(a => a.ml_prediction?.is_anomaly)}
              showHeader={true}
            />
          </div>

          {/* Right Column - Side Panel */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Quick Stats</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">{stats.criticalCount}</div>
                    <div className="text-sm text-red-700">Critical</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{stats.resolvedCount}</div>
                    <div className="text-sm text-green-700">Resolved</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Resolution Rate</span>
                    <span className="font-bold">
                      {anomalies.length > 0 ? Math.round((stats.resolvedCount / anomalies.length) * 100) : 100}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${anomalies.length > 0 ? (stats.resolvedCount / anomalies.length) * 100 : 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">System Status</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Connection</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Last Update</span>
                  <span className="text-sm">{lastUpdate.toLocaleTimeString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Active Issues</span>
                  <span className={`text-sm font-medium ${stats.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.activeAlerts}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Robot ID</span>
                  <span className="text-sm font-medium">{SELECTED_ROBOT}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowResolved(!showResolved)}
                  className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center"
                >
                  <CheckCircle className="w-5 h-5 text-blue-600 mb-2" />
                  <span className="text-sm">{showResolved ? 'Hide Resolved' : 'Show Resolved'}</span>
                </button>
                <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
                  <span className="text-sm">AI Trends</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
          <div>Maintenance Dashboard • {SELECTED_ROBOT} • {new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
}