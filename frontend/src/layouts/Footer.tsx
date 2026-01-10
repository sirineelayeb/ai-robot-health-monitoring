// src/components/layout/Footer.tsx
import React from 'react';
import { theme } from '../config/theme';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="py-6 px-4 border-t"
      style={{
        backgroundColor: theme.colors.background.default,
        borderColor: theme.colors.border.default,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo/Brand Section */}
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-md"
              style={{ backgroundColor: theme.colors.primary.main }}
            />
            <span 
              className="text-lg font-bold"
              style={{ color: theme.colors.text.primary }}
            >
              Robot Monitoring
            </span>
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap gap-4 md:gap-6">
            <a 
              href="/dashboard" 
              className="text-sm hover:underline"
              style={{ color: theme.colors.text.secondary }}
            >
              Dashboard
            </a>
            <a 
              href="/alerts" 
              className="text-sm hover:underline"
              style={{ color: theme.colors.text.secondary }}
            >
              Alerts
            </a>
            <a 
              href="/analytics" 
              className="text-sm hover:underline"
              style={{ color: theme.colors.text.secondary }}
            >
              Analytics
            </a>
            <a 
              href="/settings" 
              className="text-sm hover:underline"
              style={{ color: theme.colors.text.secondary }}
            >
              Settings
            </a>
            <a 
              href="/documentation" 
              className="text-sm hover:underline"
              style={{ color: theme.colors.text.secondary }}
            >
              Documentation
            </a>
          </div>

          {/* Status/Version Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: theme.colors.status.good.main }}
              />
              <span 
                className="text-xs"
                style={{ color: theme.colors.text.secondary }}
              >
                System Online
              </span>
            </div>
            <span 
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: theme.colors.background.card,
                color: theme.colors.text.secondary,
              }}
            >
              v1.2.0
            </span>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-6 pt-6 border-t text-center">
          <p 
            className="text-sm"
            style={{ color: theme.colors.text.secondary }}
          >
            © {currentYear} Robot Monitoring System. All rights reserved.
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: theme.colors.text.tertiary }}
          >
            For monitoring and diagnostic purposes only. Data updates every 5 seconds.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;