// components/cards/PCCPUCard.tsx
export const PCCPUCard = ({ pc_cpu_history }: { pc_cpu_history: number[] }) => {
  const latest = pc_cpu_history[pc_cpu_history.length - 1] ?? 0;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">PC CPU Load</h3>
      <p className="text-3xl font-bold text-gray-900">{latest.toFixed(1)}%</p>
      {/* Add sparkline chart if you want */}
    </div>
  );
};

