// components/cards/PCNetworkCard.tsx
export const PCNetworkCard = ({ 
  network_sent, 
  network_recv 
}: { 
  network_sent: number; 
  network_recv: number; 
}) => {
  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-4">PC Network</h3>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-500">Sent</p>
          <p className="text-2xl font-bold text-green-600">{formatBytes(network_sent)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Received</p>
          <p className="text-2xl font-bold text-blue-600">{formatBytes(network_recv)}</p>
        </div>
      </div>
    </div>
  );
};