import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  AlertTriangle, 
  Activity, 
  Battery, 
  Cpu, 
  RefreshCw, 
  Clock,
  Thermometer,
  Shield,
  Loader2,
  TrendingUp,
  Zap
} from "lucide-react";
import { getLatestTelemetry, getTelemetryHistory, getAnomalies } from "../api/telemetry";
import { initSocket } from "../services/socket";
import type { TelemetryData } from "../types/telemetry";
import MetricsGrid from "../components/history/MetricsGrid";
import { AIWarningsPanel } from "../components/panels/AIWarningsPanel";

const SELECTED_ROBOT = "robot_001";

interface TelemetryWithDate extends Omit<TelemetryData, 'timestamp'> {
  timestamp: Date;
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryWithDate | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryWithDate[]>([]);
  const [aiWarnings, setAiWarnings] = useState<TelemetryWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  const toDateTimestamp = useCallback((data: TelemetryData): TelemetryWithDate => ({
    ...data,
    timestamp: new Date(data.timestamp)
  }), []);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setIsRefreshing(true);
      setError(null);

      const [latest, history, anomalies] = await Promise.all([
        getLatestTelemetry(SELECTED_ROBOT),
        getTelemetryHistory(SELECTED_ROBOT, 50),
        getAnomalies(SELECTED_ROBOT, { limit: 20 })
      ]);

      if (latest) {
        console.log("📊 Dashboard: Fetched latest telemetry:", latest);
        setTelemetry(toDateTimestamp(latest));
        setTelemetryHistory(history.map(toDateTimestamp));
        setAiWarnings(anomalies.map(toDateTimestamp));
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load robot data");
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Socket setup for real-time updates
  useEffect(() => {
    console.log("🔌 Dashboard: Setting up socket connection for", SELECTED_ROBOT);
    
    const socket = initSocket();
    
    // Handle connection events
    const handleConnect = () => {
      console.log("✅ Dashboard: Socket connected, ID:", socket.id);
      setIsConnected(true);
      
      // Subscribe to robot events
      const room = `robot_${SELECTED_ROBOT}`;
      socket.emit("join", room);
      socket.emit("subscribe", SELECTED_ROBOT);
      console.log(`📡 Dashboard: Subscribed to ${SELECTED_ROBOT} (room: ${room})`);
    };
    
    const handleDisconnect = () => {
      console.log("❌ Dashboard: Socket disconnected");
      setIsConnected(false);
    };
    
    const handleConnectError = (err: any) => {
      console.error("🔥 Dashboard: Socket connection error:", err);
      setIsConnected(false);
    };
    
    // Handle regular telemetry updates
   // In your Dashboard component's socket setup, update the handleTelemetryUpdate function:

    const handleTelemetryUpdate = (data: TelemetryData) => {
      console.log("📡 Dashboard: Telemetry event received", {
        robot: data.robot_id,
        timestamp: data.timestamp,
        battery: data.battery_level,
        temp: data.temperature,
        hasIssues: data.detected_issues?.length || 0,
        mlAnomaly: data.ml_prediction?.is_anomaly,
        anomaly_type: data.anomaly_type,  // Check if this exists
        is_anomaly: data.is_anomaly       // Check if this exists
      });
      
      if (data.robot_id !== SELECTED_ROBOT) {
        console.log(`⚠️ Ignoring telemetry for different robot: ${data.robot_id}`);
        return;
      }
      
      // CRITICAL FIX: Ensure ALL fields are present
      const newTelemetry = toDateTimestamp({
        // Include ALL fields from the data
        ...data,
        // Make sure these critical fields are included
        is_anomaly: data.is_anomaly || false,
        anomaly_type: data.anomaly_type || null,
        ml_prediction: data.ml_prediction || null,
        detected_issues: data.detected_issues || []
      });
      
      // Update main telemetry - FORCE RE-RENDER
      setTelemetry(newTelemetry);
      setLastUpdate(new Date());
      
      // Update history
      setTelemetryHistory(prev => {
        const exists = prev.some(t => t._id === newTelemetry._id);
        const newHistory = exists 
          ? prev.map(t => t._id === newTelemetry._id ? newTelemetry : t)
          : [newTelemetry, ...prev].slice(0, 50);
        return newHistory;
      });
      
      // If telemetry has detected issues or ML anomaly, add to warnings
      if (data.detected_issues?.length > 0 || data.ml_prediction?.is_anomaly) {
        setAiWarnings(prev => {
          const exists = prev.some(t => t._id === newTelemetry._id);
          const newWarnings = exists 
            ? prev.map(t => t._id === newTelemetry._id ? newTelemetry : t)
            : [newTelemetry, ...prev].slice(0, 20);
          console.log(`🚨 Added to AI warnings. Total: ${newWarnings.length}`);
          return newWarnings;
        });
      }
      
      // Debug: Log the anomaly status
      if (data.is_anomaly || data.ml_prediction?.is_anomaly) {
        console.log("🚨 ANOMALY DETECTED IN REAL-TIME:", {
          is_anomaly: data.is_anomaly,
          anomaly_type: data.anomaly_type,
          ml_anomaly: data.ml_prediction?.is_anomaly,
          ml_type: data.ml_prediction?.anomaly_type,
          detected_issues: data.detected_issues?.length
        });
      }
    };
    
    // Handle threshold alerts (these come from detected_issues)
    // const handleThresholdAlert = (alert: ThresholdAlert) => {
    //   console.log("⚠️ Dashboard: THRESHOLD ALERT received", {
    //     robot: alert.robot_id,
    //     severity: alert.severity,
    //     issues: alert.issues?.length || 0,
    //     timestamp: alert.timestamp
    //   });
      
    //   if (alert.robot_id !== SELECTED_ROBOT) return;
      
    //   // Store active alerts
    //   setActiveAlerts(prev => {
    //     const exists = prev.some(a => a.telemetry_id === alert.telemetry_id);
    //     const newAlerts = exists 
    //       ? prev.map(a => a.telemetry_id === alert.telemetry_id ? alert : a)
    //       : [alert, ...prev].slice(0, 10);
    //     return newAlerts;
    //   });
      
    //   // Convert threshold alert to telemetry format for display
    //   const alertTelemetry: TelemetryData = {
    //     _id: alert.telemetry_id || `alert-${Date.now()}`,
    //     robot_id: alert.robot_id,
    //     timestamp: typeof alert.timestamp === 'string' ? alert.timestamp : new Date(alert.timestamp).toISOString(),
    //     battery_level: alert.metrics?.battery_level || 0,
    //     temperature: alert.metrics?.temperature || 0,
    //     motor_current: alert.metrics?.motor_current || 0,
    //     cpu_load: alert.metrics?.cpu_load || 0,
    //     velocity: alert.metrics?.velocity || 0,
    //     battery_health: 0,
    //     battery_drop_rate: 0,
    //     battery_trend: 0,
    //     encoder_ok: true,
    //     lidar_ok: true,
    //     camera_ok: true,
    //     pc_cpu_load: 0,
    //     pc_memory_load: 0,
    //     pc_disk_usage: 0,
    //     pc_network_sent: 0,
    //     pc_network_recv: 0,
    //     pc_temperature: 0,
    //     status: alert.severity || "WARNING",
    //     ml_prediction: {
    //       is_anomaly: true,
    //       anomaly_type: "threshold_violation",
    //       confidence: 0.9,
    //       features: []
    //     },
    //     detected_issues: alert.issues || []
    //   };
      
    //   const newTelemetry = toDateTimestamp(alertTelemetry);
      
    //   // Add to AI warnings panel
    //   setAiWarnings(prev => {
    //     const exists = prev.some(t => t._id === newTelemetry._id);
    //     const newWarnings = exists 
    //       ? prev.map(t => t._id === newTelemetry._id ? newTelemetry : t)
    //       : [newTelemetry, ...prev].slice(0, 20);
    //     console.log(`🚨 Threshold alert added to warnings. Total: ${newWarnings.length}`);
    //     return newWarnings;
    //   });
      
    //   // Show notification for critical alerts
    //   if (alert.severity === "CRITICAL") {
    //     console.log("🔴 CRITICAL ALERT:", alert.issues?.[0]?.message || "Critical threshold violation");
    //   }
    // };
    
    // Handle anomaly alerts
    const handleAnomalyAlert = (data: TelemetryData) => {
      console.log("🤖 Dashboard: ANOMALY ALERT received", {
        robot: data.robot_id,
        isAnomaly: data.ml_prediction?.is_anomaly,
        type: data.ml_prediction?.anomaly_type,
        confidence: data.ml_prediction?.confidence
      });
      
      if (data.robot_id !== SELECTED_ROBOT) return;
      
      const newTelemetry = toDateTimestamp(data);
      
      // Add to AI warnings
      setAiWarnings(prev => {
        const exists = prev.some(t => t._id === newTelemetry._id);
        const newWarnings = exists 
          ? prev.map(t => t._id === newTelemetry._id ? newTelemetry : t)
          : [newTelemetry, ...prev].slice(0, 20);
        console.log(`🤖 ML anomaly added to warnings. Total: ${newWarnings.length}`);
        return newWarnings;
      });
    };
    
    // Handle robot_update events
    const handleRobotUpdate = (data: TelemetryData) => {
      console.log("🤖 Dashboard: Robot update received", {
        robot: data.robot_id,
        timestamp: data.timestamp
      });
      
      if (data.robot_id !== SELECTED_ROBOT) return;
      
      const newTelemetry = toDateTimestamp(data);
      setTelemetry(newTelemetry);
      setLastUpdate(new Date());
    };
    
    // Setup all event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("telemetry", handleTelemetryUpdate);
    // socket.on("threshold_alert", handleThresholdAlert);
    socket.on("anomaly_alert", handleAnomalyAlert);
    socket.on("robot_update", handleRobotUpdate);
    
    // Listen for confirmation events
    socket.on("joined", (data: any) => {
      console.log("✅ Dashboard: Joined room confirmation:", data);
    });
    
    socket.on("subscribed", (data: any) => {
      console.log("✅ Dashboard: Subscribed confirmation:", data);
    });
    
    socket.on("connected", (data: any) => {
      console.log("✅ Dashboard: Server connected event:", data);
    });
    
    // Debug: listen to ALL events to see what's coming
    socket.onAny((eventName: string, ...args: any[]) => {
      if (!['pong', 'ping'].includes(eventName)) {
        console.log(`🎯 Dashboard: [${eventName}]`, args[0] ? 'Has data' : 'No data');
      }
    });
    
    // If already connected, trigger subscription
    if (socket.connected) {
      console.log("🔗 Dashboard: Socket already connected, subscribing...");
      handleConnect();
    } else {
      console.log("⏳ Dashboard: Waiting for socket connection...");
    }
    
    // Cleanup
    return () => {
      console.log("🧹 Dashboard: Cleaning up socket listeners");
      
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("telemetry", handleTelemetryUpdate);
      // socket.off("threshold_alert", handleThresholdAlert);
      socket.off("anomaly_alert", handleAnomalyAlert);
      socket.off("robot_update", handleRobotUpdate);
      socket.off("joined");
      socket.off("subscribed");
      socket.off("connected");
      socket.offAny();
      
      if (socket.connected) {
        socket.emit("unsubscribe", SELECTED_ROBOT);
        socket.emit("leave", `robot_${SELECTED_ROBOT}`);
      }
    };
  }, [toDateTimestamp]);

  // Debug effect - monitor state changes
  useEffect(() => {
    console.log("📊 Dashboard State Update:", {
      connected: isConnected,
      telemetry: telemetry ? `Loaded (${telemetry.battery_level}%)` : 'null',
      historyCount: telemetryHistory.length,
      warningsCount: aiWarnings.length,
      alertsCount: activeAlerts.length,
      lastUpdate: lastUpdate.toLocaleTimeString()
    });
  }, [telemetry, isConnected, telemetryHistory.length, aiWarnings.length, activeAlerts.length, lastUpdate]);

  // Test connection
  const handleTestConnection = () => {
    const socket = initSocket();
    
    console.log("🔍 Connection Test:", {
      connected: socket.connected,
      id: socket.id,
      backend: import.meta.env.VITE_API_URL || "http://localhost:3000"
    });
    
    // Test backend health
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/health`)
      .then(res => res.json())
      .then(data => {
        console.log("✅ Backend Health:", data);
        alert(`Backend Status: ${data.status}\nConnected Clients: ${data.connectedClients}\nMongoDB: ${data.mongodb}`);
      })
      .catch(err => {
        console.error("❌ Backend error:", err);
        alert("Backend not reachable");
      });
  };



  const stats = useMemo(() => {
    if (!telemetry) return null;

    const criticalCount = aiWarnings.filter(a => a.status === "CRITICAL").length;
    const warningCount = aiWarnings.filter(a => a.status === "WARNING").length;
    
    const sensorHealth = [
      telemetry.encoder_ok,
      telemetry.lidar_ok,
      telemetry.camera_ok
    ].filter(Boolean).length;

    return { criticalCount, warningCount, sensorHealth };
  }, [telemetry, aiWarnings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600">Connecting to {SELECTED_ROBOT}...</p>
        </div>
      </div>
    );
  }

  if (error || !telemetry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Connection Lost</h3>
          <p className="text-slate-600 mb-6">{error || "Unable to connect to robot"}</p>
          <button 
            onClick={() => fetchData()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-[1800px] mx-auto p-6 lg:p-8">
        
        {/* Header */}
        <header className="mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">ROBOHEALTH</h1>
                    <p className="text-sm text-slate-600">Real-time telemetry and AI-powered analytics</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2 rounded-xl border border-indigo-200">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-semibold text-slate-900">{SELECTED_ROBOT}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {isConnected ? 'Live' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                  {activeAlerts.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">
                        🚨 {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600"
                >
                  Test Connection
                </button>
            
                <button
                  onClick={() => fetchData(false)}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 transition-all font-medium text-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Alert Banner (if active alerts) */}
        {activeAlerts.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-bold text-red-800">Active Alerts</h3>
                  <p className="text-sm text-red-600">
                    {activeAlerts.length} threshold violation{activeAlerts.length !== 1 ? 's' : ''} detected
                  </p>
                </div>
              </div>
              <div className="text-sm text-red-700">
                {activeAlerts.filter(a => a.severity === "CRITICAL").length} critical • {activeAlerts.filter(a => a.severity === "WARNING").length} warning
              </div>
            </div>
          </div>
        )}

        {/* Status Cards Grid - Keep your existing JSX */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Battery Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
                  <Battery className="w-6 h-6 text-emerald-600" />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  telemetry.battery_level < 30 ? "bg-red-100 text-red-700" :
                  telemetry.battery_level < 50 ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"
                }`}>
                  {telemetry.battery_level < 30 ? "LOW" : telemetry.battery_level < 50 ? "MEDIUM" : "GOOD"}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Battery Level</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-slate-900">{telemetry.battery_level}%</span>
                <span className="text-sm text-slate-500">Health: {telemetry.battery_health}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                    telemetry.battery_level < 30 ? "from-red-500 to-red-600" :
                    telemetry.battery_level < 50 ? "from-amber-500 to-amber-600" :
                    "from-emerald-500 to-teal-500"
                  }`}
                  style={{ width: `${telemetry.battery_level}%` }}
                />
              </div>
            </div>

            {/* CPU Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <Cpu className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  telemetry.cpu_load > 85 ? "bg-red-100 text-red-700" :
                  telemetry.cpu_load > 70 ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"
                }`}>
                  {telemetry.cpu_load > 85 ? "HIGH" : telemetry.cpu_load > 70 ? "MEDIUM" : "NORMAL"}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">CPU Load</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-slate-900">{telemetry.cpu_load}%</span>
                <span className="text-sm text-slate-500">{telemetry.motor_current}A motor</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                    telemetry.cpu_load > 85 ? "from-red-500 to-red-600" :
                    telemetry.cpu_load > 70 ? "from-amber-500 to-amber-600" :
                    "from-blue-500 to-indigo-500"
                  }`}
                  style={{ width: `${telemetry.cpu_load}%` }}
                />
              </div>
            </div>

            {/* Temperature Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl">
                  <Thermometer className="w-6 h-6 text-orange-600" />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  telemetry.temperature > 70 ? "bg-red-100 text-red-700" :
                  telemetry.temperature > 50 ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"
                }`}>
                  {telemetry.temperature > 70 ? "HOT" : telemetry.temperature > 50 ? "WARM" : "COOL"}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Temperature</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-slate-900">{telemetry.temperature}°C</span>
                <span className="text-sm text-slate-500">{telemetry.velocity.toFixed(1)} m/s</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                    telemetry.temperature > 70 ? "from-red-500 to-red-600" :
                    telemetry.temperature > 50 ? "from-orange-500 to-amber-500" :
                    "from-emerald-500 to-teal-500"
                  }`}
                  style={{ width: `${Math.min(telemetry.temperature, 100)}%` }}
                />
              </div>
            </div>

            {/* Sensors Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  stats.sensorHealth === 3 ? "bg-emerald-100 text-emerald-700" :
                  stats.sensorHealth >= 2 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {stats.sensorHealth === 3 ? "ALL OK" : stats.sensorHealth >= 2 ? "PARTIAL" : "ERROR"}
                </span>
              </div>
              
              <h3 className="text-sm font-medium text-slate-600 mb-1">Sensor Health</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-slate-900">{stats.sensorHealth}/3</span>
                <span className="text-sm text-slate-500">Active sensors</span>
              </div>
              
              {/* Sensor status bars with names */}
              <div className="space-y-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">Encoder</span>
                      <span className={`text-xs font-medium ${telemetry.encoder_ok ? "text-emerald-600" : "text-red-600"}`}>
                        {telemetry.encoder_ok ? "OK" : "FAILED"}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${telemetry.encoder_ok ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-red-400"}`} />
                  </div>
                </div>
                
                {/* LIDAR Sensor */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">LIDAR</span>
                      <span className={`text-xs font-medium ${telemetry.lidar_ok ? "text-emerald-600" : "text-red-600"}`}>
                        {telemetry.lidar_ok ? "OK" : "FAILED"}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${telemetry.lidar_ok ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-red-400"}`} />
                  </div>
                </div>
                
                {/* Camera Sensor */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">Camera</span>
                      <span className={`text-xs font-medium ${telemetry.camera_ok ? "text-emerald-600" : "text-red-600"}`}>
                        {telemetry.camera_ok ? "OK" : "FAILED"}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${telemetry.camera_ok ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-red-400"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Metrics & AI */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Performance Metrics */}
            <section>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Performance Metrics</h2>
                        <p className="text-sm text-slate-600">Real-time system monitoring</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`text-sm font-medium ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isConnected ? 'Live' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <MetricsGrid history={telemetryHistory} />
                </div>
              </div>
            </section>

            {/* AI Detection */}
            <section>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">AI Anomaly Detection</h2>
                        <p className="text-sm text-slate-600">Machine learning predictions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.criticalCount > 0 && (
                        <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          {stats.criticalCount}
                        </span>
                      )}
                      {stats.warningCount > 0 && (
                        <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          {stats.warningCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <AIWarningsPanel telemetryList={aiWarnings} showHeader={false} />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: PC & Robot Systems */}
          <div className="space-y-8">
            
            {/* PC System Stats */}
<section>
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl">
        <Cpu className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <h3 className="font-bold text-slate-900">PC System</h3>
        <p className="text-xs text-slate-600">Control computer status</p>
      </div>
    </div>
    
    <div className="space-y-4">
      {/* <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">CPU Usage</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{telemetry.pc_cpu_load}%</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              telemetry.pc_cpu_load > 85 ? "bg-red-100 text-red-700" :
              telemetry.pc_cpu_load > 70 ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {telemetry.pc_cpu_load > 85 ? "HIGH" : telemetry.pc_cpu_load > 70 ? "MEDIUM" : "NORMAL"}
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
            style={{ width: `${telemetry.pc_cpu_load}%` }}
          />
        </div>
      </div> */}

      {/* <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Memory</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{telemetry.pc_memory_load}%</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              telemetry.pc_memory_load > 85 ? "bg-red-100 text-red-700" :
              telemetry.pc_memory_load > 70 ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {telemetry.pc_memory_load > 85 ? "HIGH" : telemetry.pc_memory_load > 70 ? "MEDIUM" : "NORMAL"}
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${telemetry.pc_memory_load}%` }}
          />
        </div>
      </div> */}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Disk Usage</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{telemetry.pc_disk_usage}%</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              telemetry.pc_disk_usage > 85 ? "bg-red-100 text-red-700" :
              telemetry.pc_disk_usage > 70 ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {telemetry.pc_disk_usage > 85 ? "HIGH" : telemetry.pc_disk_usage > 70 ? "MEDIUM" : "NORMAL"}
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
            style={{ width: `${telemetry.pc_disk_usage}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Temperature</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{telemetry.pc_temperature}°C</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              telemetry.pc_temperature > 70 ? "bg-red-100 text-red-700" :
              telemetry.pc_temperature > 60 ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {telemetry.pc_temperature > 70 ? "HOT" : telemetry.pc_temperature > 60 ? "WARM" : "NORMAL"}
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
              telemetry.pc_temperature > 70 ? "from-red-500 to-red-600" :
              telemetry.pc_temperature > 60 ? "from-orange-500 to-amber-500" :
              "from-emerald-500 to-teal-500"
            }`}
            style={{ width: `${Math.min(telemetry.pc_temperature, 100)}%` }}
          />
        </div>
      </div>

      {/* Network Usage - Sent */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Network Sent</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {telemetry.pc_network_sent >= 1000000 
                ? `${(telemetry.pc_network_sent / 1000000).toFixed(2)} MB`
                : telemetry.pc_network_sent >= 1000
                ? `${(telemetry.pc_network_sent / 1000).toFixed(2)} KB`
                : `${telemetry.pc_network_sent} B`}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              telemetry.pc_network_sent > 5000000 ? "bg-red-100 text-red-700" :
              telemetry.pc_network_sent > 1000000 ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {telemetry.pc_network_sent > 5000000 ? "HIGH" : telemetry.pc_network_sent > 1000000 ? "MEDIUM" : "LOW"}
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
              telemetry.pc_network_sent > 5000000 ? "from-red-500 to-red-600" :
              telemetry.pc_network_sent > 1000000 ? "from-orange-500 to-amber-500" :
              "from-emerald-500 to-teal-500"
            }`}
            style={{ 
              width: `${Math.min((telemetry.pc_network_sent / 10000000) * 100, 100)}%` 
            }}
          />
        </div>
      </div>

      {/* Network Usage - Received */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Network Received</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {telemetry.pc_network_recv >= 1000000 
                ? `${(telemetry.pc_network_recv / 1000000).toFixed(2)} MB`
                : telemetry.pc_network_recv >= 1000
                ? `${(telemetry.pc_network_recv / 1000).toFixed(2)} KB`
                : `${telemetry.pc_network_recv} B`}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              telemetry.pc_network_recv > 5000000 ? "bg-red-100 text-red-700" :
              telemetry.pc_network_recv > 1000000 ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {telemetry.pc_network_recv > 5000000 ? "HIGH" : telemetry.pc_network_recv > 1000000 ? "MEDIUM" : "LOW"}
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
              telemetry.pc_network_recv > 5000000 ? "from-red-500 to-red-600" :
              telemetry.pc_network_recv > 1000000 ? "from-orange-500 to-amber-500" :
              "from-emerald-500 to-teal-500"
            }`}
            style={{ 
              width: `${Math.min((telemetry.pc_network_recv / 10000000) * 100, 100)}%` 
            }}
          />
        </div>
      </div>
    </div>
  </div>
</section>

            {/* Sensor Details */}
            {/* <section>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Sensor Status</h3>
                    <p className="text-xs text-slate-600">Hardware diagnostics</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">Encoder</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      telemetry.encoder_ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {telemetry.encoder_ok ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">LiDAR</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      telemetry.lidar_ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {telemetry.lidar_ok ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">Camera</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      telemetry.camera_ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {telemetry.camera_ok ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>
            </section> */}
          </div>
        </div>

           {/* Simple Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
          <div>Administrator Dashboard • {SELECTED_ROBOT} • {new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
}