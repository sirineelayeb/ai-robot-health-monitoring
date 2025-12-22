// src/config/theme.ts

export const theme = {
  // -----------------------------
  // COLOR PALETTE
  // -----------------------------
  colors: {
    // Primary grayscale
    primary: {
      dark: "#111827",
      medium: "#374151",
      light: "#6b7280",
      lighter: "#9ca3af",
    },

    // Background colors
    background: {
      main: "#f9fafb",
      card: "#ffffff",
      hover: "#f3f4f6",
    },

    // Border colors
    border: {
      default: "#e5e7eb",
      light: "#f3f4f6",
    },

    // Text colors
    text: {
      primary: "#111827",
      secondary: "#6b7280",
      tertiary: "#9ca3af",
      label: "#374151",
    },

    // Status colors for robot/anomaly
    status: {
      good: { main: "#22c55e", light: "#bbf7d0", bg: "#dcfce7" },      // green
      warning: { main: "#facc15", light: "#fef08a", bg: "#fef9c3" },   // yellow
      critical: { main: "#ef4444", light: "#fca5a5", bg: "#fee2e2" },  // red
    },

    // Chart colors
    chart: {
      line: "#374151",
      fill: "#e5e7eb",
      grid: "#f3f4f6",
      axis: "#9ca3af",
    },

    // Metric-specific colors
    metrics: {
      battery: { main: "#1e40af", light: "#60a5fa", bg: "#eff6ff" },
      motorTemp: { main: "#b91c1c", light: "#f87171", bg: "#fef2f2" },
      motorCurrent: { main: "#7e22ce", light: "#c084fc", bg: "#faf5ff" },
      cpuLoad: { main: "#15803d", light: "#4ade80", bg: "#f0fdf4" },
      velocity: { main: "#c2410c", light: "#fb923c", bg: "#fff7ed" },
      anomalyScore: { main: "#be185d", light: "#f472b6", bg: "#fdf2f8" },
    },
  },

  // -----------------------------
  // CARD STYLES
  // -----------------------------
  card: {
    base: "bg-white rounded-lg shadow-sm border border-gray-200",
    padding: "p-6",
    hover: "hover:shadow-md transition-shadow",
  },

  // -----------------------------
  // TYPOGRAPHY
  // -----------------------------
  typography: {
    heading: {
      h1: "text-3xl font-semibold text-gray-900",
      h2: "text-2xl font-semibold text-gray-900",
      h3: "text-xl font-semibold text-gray-900",
    },
    label: "text-sm font-medium text-gray-700 uppercase tracking-wide",
    body: "text-base text-gray-600",
    caption: "text-xs text-gray-500",
    value: "text-2xl font-semibold text-gray-900",
  },

  // -----------------------------
  // SPACING
  // -----------------------------
  spacing: {
    card: "p-6",
    section: "mb-8",
    element: "mb-4",
  },

  // -----------------------------
  // SHADOWS
  // -----------------------------
  shadow: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  },

  // -----------------------------
  // BORDER RADIUS
  // -----------------------------
  radius: {
    sm: "rounded",
    md: "rounded-lg",
    lg: "rounded-xl",
    full: "rounded-full",
  },
};

// -----------------------------
// HELPER FUNCTIONS
// -----------------------------
export const getStatusColor = (
  value: number,
  thresholds: { good: number; warning: number }
) => {
  if (value > thresholds.good) return theme.colors.status.good;
  if (value > thresholds.warning) return theme.colors.status.warning;
  return theme.colors.status.critical;
};

export const getStatusText = (
  value: number,
  thresholds: { good: number; warning: number }
): string => {
  if (value > thresholds.good) return "NORMAL";
  if (value > thresholds.warning) return "WARNING";
  return "CRITICAL";
};
