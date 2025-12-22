import React from "react";
import { Outlet } from "react-router-dom";

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-4">
        <h1>AI Robot Dashboard</h1>
      </header>

      <main className="p-6">
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
};

export default MainLayout;
