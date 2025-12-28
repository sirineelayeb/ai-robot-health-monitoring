// src/config/theme.ts

export const theme = {
  // =============================
  // COLORS
  // =============================
  colors: {
    // -----------------------------
    // PRIMARY BRAND
    // -----------------------------
    primary: {
      dark: "#0f172a",
      medium: "#1e40af",
      light: "#60a5fa",
      accent: "#22d3ee",
    },

    // -----------------------------
    // NEUTRAL SYSTEM
    // -----------------------------
    neutral: {
      900: "#0f172a",
      700: "#334155",
      600: "#475569",
      400: "#94a3b8",
      200: "#e2e8f0",
      100: "#f1f5f9",
      50: "#f8fafc",
    },

    // -----------------------------
    // BACKGROUND
    // -----------------------------
    background: {
      main: "#f8fafc",
      card: "#ffffff",
      subtle: "#f1f5f9",
      hover: "#e2e8f0",
    },

    // -----------------------------
    // BORDER (BACKWARD COMPAT)
    // -----------------------------
    border: {
      default: "#e2e8f0",
      light: "#f1f5f9",
    },

    // -----------------------------
    // TEXT
    // -----------------------------
    text: {
      primary: "#0f172a",
      secondary: "#47556",
      muted: "#64748b",
      label: "#334155",
      inverted: "#ffffff",
    },

    // -----------------------------
    // STATUS COLORS
    // -----------------------------
    status: {
      good: {
        main: "#10b981",
        soft: "#6ee7b7",
        bg: "#ecfdf5",
      },
      warning: {
        main: "#f59e0b",
        soft: "#fde68a",
        bg: "#fffbeb",
      },
      critical: {
        main: "#ef4444",
        soft: "#fca5a5",
        bg: "#fef2f2",
      },
    },

    // -----------------------------
    // CHART COLORS
    // -----------------------------
    chart: {
      primary: "#2563eb",
      secondary: "#22d3ee",
      grid: "#e2e8f0",
      axis: "#94a3b8",
      fill: "#eff6ff",
      line: "#4f46e5"
    },

    // -----------------------------
    // METRICS (FULLY SAFE)
    // -----------------------------
    metrics: {
      battery: {
        main: "#06b6d4",
        soft: "#67e8f9",
        light: "#67e8f9", // backward compatibility
        bg: "#ecfeff",
      },
      motorTemp: {
        main: "#fb923c",
        soft: "#fed7aa",
        light: "#fed7aa",
        bg: "#fff7ed",
      },
      motorCurrent: {
        main: "#8b5cf6",
        soft: "#c4b5fd",
        light: "#c4b5fd",
        bg: "#f5f3ff",
      },
      cpuLoad: {
        main: "#3b82f6",
        soft: "#bfdbfe",
        light: "#bfdbfe",
        bg: "#eff6ff",
      },
      velocity: {
        main: "#14b8a6",
        soft: "#99f6e4",
        light: "#99f6e4",
        bg: "#f0fdfa",
      },
      anomalyScore: {
        main: "#ec4899",
        soft: "#fbcfe8",
        light: "#fbcfe8",
        bg: "#fdf2f8",
      },
    },
  },

  // =============================
  // CARD SYSTEM
  // =============================
  card: {
    base:
      "bg-white rounded-xl border border-slate-200 shadow-sm",
    padding: "p-6",
    hover:
      "hover:shadow-md hover:border-slate-300 transition-all duration-200",
  },

  // =============================
  // TYPOGRAPHY
  // =============================
  typography: {
    heading: {
      h1: "text-3xl font-semibold text-slate-900 tracking-tight",
      h2: "text-2xl font-semibold text-slate-900 tracking-tight",
      h3: "text-xl font-semibold text-slate-800",
    },
    label:
      "text-xs font-semibold text-slate-500 uppercase tracking-widest",
    body: "text-sm text-slate-600 leading-relaxed",
    caption: "text-xs text-slate-500",
    value: "text-2xl font-bold text-slate-900",
  },

  // =============================
  // SPACING
  // =============================
  spacing: {
    card: "p-6",
    section: "mb-10",
    element: "mb-4",
  },

  // =============================
  // SHADOWS
  // =============================
  shadow: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg shadow-slate-200/50",
  },

  // =============================
  // RADIUS
  // =============================
  radius: {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    full: "rounded-full",
  },
};

// =============================
// HELPERS
// =============================
export const getStatusColor = (
  value: number,
  thresholds: { good: number; warning: number; critical: number }
) => {
  if (value >= thresholds.critical) return theme.colors.status.critical;
  if (value >= thresholds.warning) return theme.colors.status.warning;
  return theme.colors.status.good;
};

export const getStatusText = (
  value: number,
  thresholds: { good: number; warning: number; critical: number }
) => {
  if (value >= thresholds.critical) return "CRITICAL";
  if (value >= thresholds.warning) return "WARNING";
  return "NORMAL";
};
