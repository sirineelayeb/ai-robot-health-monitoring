import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getLatestTelemetry,
  getTelemetryHistory,
  getStatistics,
  getAnomalies
} from "../api/telemetry";

import { subscribeTelemetry } from "../services/socket";
import type { TelemetryData, TelemetryStats } from "../types/telemetry";

import { BatteryCard } from "../components/cards/BatteryCard";
import { CPULoadCard } from "../components/cards/CPULoadCard";
import { StatusCard } from "../components/cards/StatusCard";
import { MotorTempCard } from "../components/cards/MotorTempCard";
import { MotorCurrentCard } from "../components/cards/MotorCurrentCard";
import { VelocityCard } from "../components/cards/VelocityCard";
// import { PredictionBadge } from "../components/cards/PredictionBadge";
import { StatsCard } from "../components/cards/StatsCard";
// import { AIWarningsPanel } from "../components/panels/AIWarningsPanel";
// import { AnomaliesList } from "../components/panels/AnomaliesList";
import { PCCPUCard } from "../components/cards/PCCPUCard";
import { PCMemoryCard } from "../components/cards/PCMemoryCard";
import { PCDiskCard } from "../components/cards/PCDiskCard";
import { PCTempCard } from "../components/cards/PCTempCard";
import { PCNetworkCard } from "../components/cards/PCNetworkCard";
import { SensorHealthCard } from "../components/cards/SensorHealthCard";

export default function Dashboard() {
  const robots = ["robot_001", "robot_002"];
  const [selectedRobot, setSelectedRobot] = useState<string>(robots[0]);

  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [anomalies, setAnomalies] = useState<TelemetryData[]>([]);
  const [history, setHistory] = useState<{
    battery_level: number[];
    cpu_load: number[];
    temperature: number[];
    motor_current: number[];
    velocity: number[];
    // PC metrics
    pc_cpu_load: number[];
    pc_memory_load: number[];
    pc_disk_usage: number[];
    pc_temperature: number[];
  }>({
    battery_level: [],
    cpu_load: [],
    temperature: [],
    motor_current: [],
    velocity: [],
    pc_cpu_load: [],
    pc_memory_load: [],
    pc_disk_usage: [],
    pc_temperature: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------
  // Fetch initial data
  // ---------------------------
  useEffect(() => {
    if (!selectedRobot) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

          const [latest, histData, statsData, anomalyData] = await Promise.all([
          getLatestTelemetry(selectedRobot),
          getTelemetryHistory(selectedRobot, 50),
          getStatistics(selectedRobot),
          getAnomalies(selectedRobot),
        ]);

        if (!isMounted) return;

        if (latest) {
          // Normalize timestamp
          const latestNormalized: TelemetryData = {
            ...latest,
            timestamp: new Date(latest.timestamp),
          };
          setTelemetry(latestNormalized);

          setHistory({
            battery_level: histData.map((t) => t.battery_level ?? 0),
            cpu_load: histData.map((t) => t.cpu_load ?? 0),
            temperature: histData.map((t) => t.temperature ?? 0),
            motor_current: histData.map((t) => t.motor_current ?? 0),
            velocity: histData.map((t) => t.velocity ?? 0),
            pc_cpu_load: histData.map((t) => t.pc_cpu_load ?? 0),
              pc_memory_load: histData.map((t) => t.pc_memory_load ?? 0),
              pc_disk_usage: histData.map((t) => t.pc_disk_usage ?? 0),
              pc_temperature: histData.map((t) => t.pc_temperature ?? 0),
          });
        }

        setStats(statsData);

      setAnomalies(
      anomalyData.map(a => ({
        ...a,
        timestamp: new Date(a.timestamp), // convert ISO string to Date
      }))
    );
  } catch (err: any) {
      console.error(err);
      setError("Failed to load telemetry data");
    } finally {
      setLoading(false);
    }
  };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedRobot]);

  // ---------------------------
  // Live telemetry subscription
  // ---------------------------
  useEffect(() => {
    if (!selectedRobot) return;

 const handleTelemetry = (data: any) => {
  if (data.robot_id !== selectedRobot && (!data._doc || data._doc.robot_id !== selectedRobot)) return;

  const telemetry: TelemetryData = data._doc ? { ...data._doc } : data;
  telemetry.timestamp = new Date(telemetry.timestamp);

  setTelemetry(telemetry);

  // Update history
setHistory((prev) => ({
  battery_level: [...prev.battery_level.slice(-49), telemetry.battery_level ?? 0], // Changed
  cpu_load: [...prev.cpu_load.slice(-49), telemetry.cpu_load ?? 0],
  temperature: [...prev.temperature.slice(-49), telemetry.temperature ?? 0], // Changed
  motor_current: [...prev.motor_current.slice(-49), telemetry.motor_current ?? 0],
  velocity: [...prev.velocity.slice(-49), telemetry.velocity ?? 0],
  pc_cpu_load: [...prev.pc_cpu_load.slice(-49), telemetry.pc_cpu_load ?? 0],
  pc_memory_load: [...prev.pc_memory_load.slice(-49), telemetry.pc_memory_load ?? 0],
  pc_disk_usage: [...prev.pc_disk_usage.slice(-49), telemetry.pc_disk_usage ?? 0],
  pc_temperature: [...prev.pc_temperature.slice(-49), telemetry.pc_temperature ?? 0],
}));

 // Update anomalies list in real time
if (telemetry.is_anomaly) {
  setAnomalies((prev) => {
    const updated = [telemetry, ...prev];

    // Remove duplicates by _id
    const unique = Array.from(new Map(updated.map(a => [a._id, a])).values());

    // Keep only latest N anomalies, e.g., 50
    return unique.slice(0, 50);
  });
}


  // === Update stats in real time ===
 setStats((prevStats) => {
  const lastAnomalyTime = telemetry.is_anomaly
    ? telemetry.timestamp.toISOString()
    : prevStats?.lastAnomalyTime ?? null;

  const totalAnomalies = prevStats
    ? prevStats.totalAnomalies + (telemetry.is_anomaly ? 1 : 0)
    : telemetry.is_anomaly
    ? 1
    : 0;

  const totalRecords = prevStats ? prevStats.totalRecords + 1 : 1;

  const anomalyPercentage = (totalAnomalies / totalRecords) * 100;

  return {
    lastAnomalyTime,
    totalAnomalies,
    anomalyPercentage,
    totalRecords,
  };
});


  setLoading(false);
};


    const unsubscribe = subscribeTelemetry(handleTelemetry);

    return () => unsubscribe?.();
  }, [selectedRobot]);

  // ---------------------------
  // Render UI
  // ---------------------------
  if (loading) return <p className="p-6">Loading telemetry data...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!telemetry) return <p className="p-6">No telemetry available</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            Robot Health Monitor
          </h1>
          <p className="text-gray-500">
            Real-time telemetry & AI anomaly detection
          </p>
        </div>

        {/* Robot Selector */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {robots.map((robotId) => (
              <button
                key={robotId}
                onClick={() => setSelectedRobot(robotId)}
                className={`px-4 py-2 rounded-md text-sm font-medium
                  transition-all duration-200
                  ${selectedRobot === robotId
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {robotId}
              </button>
            ))}
          </div>

          <Link
            to={`/history/${selectedRobot}`}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500
              text-white text-sm font-semibold shadow-md
              hover:from-blue-500 hover:to-cyan-400
              transition-all duration-200"
          >
            View History
          </Link>
        </div>

        {/* AI Prediction */}
        {/* <PredictionBadge telemetry={telemetry} /> */}

        {/* Statistics */}
        <div className="mt-6">
          {/* <StatsCard stats={stats} /> */}
        </div>

        {/* Telemetry Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
         <BatteryCard 
  battery={telemetry.battery_level ?? 0} // Changed from battery
  // anomaly={telemetry.is_anomaly && telemetry.anomaly_type === "BATTERY_DEGRADATION"} 
/>
<CPULoadCard cpu_load={telemetry.cpu_load ?? 0} />
<StatusCard status={telemetry.status} />
<MotorTempCard motor_temp_history={history.temperature} /> {/* Changed */}
<MotorCurrentCard motor_current_history={history.motor_current} />
<VelocityCard velocity_history={history.velocity} />
        <SensorHealthCard 
    encoder_ok={telemetry.encoder_ok}
    lidar_ok={telemetry.lidar_ok}
    camera_ok={telemetry.camera_ok}
  />
          </div>
        <div className="mt-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">PC Metrics</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <PCCPUCard pc_cpu_history={history.pc_cpu_load} />
    <PCMemoryCard pc_memory_history={history.pc_memory_load} />
    <PCDiskCard pc_disk_history={history.pc_disk_usage} />
    <PCTempCard pc_temperature_history={history.pc_temperature} />
    <PCNetworkCard 
      network_sent={telemetry.pc_network_sent ?? 0}
      network_recv={telemetry.pc_network_recv ?? 0}
    />
    </div>
  </div>

        {/* AI Warnings & Anomalies */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* <AIWarningsPanel telemetry={telemetry} /> */}
          {/* <AnomaliesList anomalies={anomalies} /> */}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
