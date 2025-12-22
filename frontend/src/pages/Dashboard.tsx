import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLatestTelemetry, fetchHistoricalTelemetry } from "../api/telemetry";
import { subscribeTelemetry } from "../services/socket";
import type { TelemetryData } from "../types/telemetry";

import { BatteryCard } from "../components/cards/BatteryCard";
import { CPULoadCard } from "../components/cards/CPULoadCard";
import { StatusCard } from "../components/cards/StatusCard";
import { MotorTempCard } from "../components/cards/MotorTempCard";
import { MotorCurrentCard } from "../components/cards/MotorCurrentCard";
import { VelocityCard } from "../components/cards/VelocityCard";
import { AIWarningsPanel } from "../components/AIWarningsPanel";

export default function Dashboard() {
  const [robots] = useState<string[]>(["robot_001", "robot_002"]);
  const [selectedRobot, setSelectedRobot] = useState<string>(robots[0]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<{ motor_temp: number[]; motor_current: number[]; velocity: number[] }>({
    motor_temp: [],
    motor_current: [],
    velocity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest telemetry & history
  useEffect(() => {
    if (!selectedRobot) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const latest = await getLatestTelemetry(selectedRobot);
        setTelemetry(latest);

        const hist = await fetchHistoricalTelemetry(selectedRobot, 50) || [];
        // Defensive: ensure hist is an array
        const histArray = Array.isArray(hist) ? hist : [hist];

        setHistory({
          motor_temp: histArray.map((t) => t.motor_temp ?? 0),
          motor_current: histArray.map((t) => t.motor_current ?? 0),
          velocity: histArray.map((t) => t.velocity ?? 0),
        });
      } catch (err: any) {
        console.error("Error fetching telemetry:", err);
        setError(err.message || "Failed to load telemetry data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRobot]);

  // Subscribe to live telemetry
  useEffect(() => {
    const handleTelemetry = (data: TelemetryData) => {
      if (data.robot_id !== selectedRobot) return;

      setTelemetry(data);

      setHistory((prev) => ({
        motor_temp: [...prev.motor_temp.slice(-49), data.motor_temp ?? 0],
        motor_current: [...prev.motor_current.slice(-49), data.motor_current ?? 0],
        velocity: [...prev.velocity.slice(-49), data.velocity ?? 0],
      }));
    };

    const unsubscribe = subscribeTelemetry(handleTelemetry);
    return () => unsubscribe?.();
  }, [selectedRobot]);

  if (loading) return <p className="p-6">Loading telemetry data...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!telemetry) return <p className="p-6">No telemetry available</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Robot Health Monitor</h1>
          <p className="text-gray-500">Real-time telemetry monitoring system</p>
        </div>

        {/* Robot Selector / History Links */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Select Robot</h2>
          <div className="flex gap-4">
            {robots.map((robotId) => (
              <button
                key={robotId}
                onClick={() => setSelectedRobot(robotId)}
                className={`px-4 py-2 rounded ${
                  selectedRobot === robotId ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {robotId}
              </button>
            ))}
            <Link
              to={`/history/${selectedRobot}`}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 transition"
            >
              View History
            </Link>
          </div>
        </div>

        Stats Grid
        <div className="grid grid-cols-3 gap-6">
          <BatteryCard battery={telemetry.battery ?? 0} />
          <CPULoadCard cpu_load={telemetry.cpu_load ?? 0} />
          <StatusCard status={telemetry.status ?? "NORMAL"} />
          <MotorTempCard motor_temp_history={history.motor_temp} />
          <MotorCurrentCard motor_current_history={history.motor_current} />
          <VelocityCard velocity_history={history.velocity} />
        </div>
<AIWarningsPanel telemetry={telemetry} />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
