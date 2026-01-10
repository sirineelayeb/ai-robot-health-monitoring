export const theme = {
  colors: {
    primary: {
      dark: "#1e293b",       // slightly softer dark blue-gray
      medium: "#2563eb",     // main blue for buttons & links
      light: "#60a5fa",      // hover or subtle highlights
      accent: "#22d3ee",     // bright accent for actionable items
    },

    neutral: {
      900: "#0f172a",
      700: "#334155",
      600: "#475569",
      400: "#94a3b8",
      200: "#e2e8f0",
      100: "#f1f5f9",
      50: "#f8fafc",
    },

    background: {
      main: "#f8fafc",
      card: "#ffffff",
      subtle: "#f1f5f9",
      hover: "#e5e7eb",
    },

    border: {
      default: "#d1d5db",
      light: "#e5e7eb",
    },

    text: {
      primary: "#0f172a",
      secondary: "#475569",  
      muted: "#64748b",
      label: "#334155",
      inverted: "#ffffff",
    },

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

    chart: {
      primary: "#2563eb",
      secondary: "#22d3ee",
      tertiary: "#9333ea",   // added distinct third color
      grid: "#e5e7eb",
      axis: "#94a3b8",
      fill: "#eff6ff",
      line: "#4f46e5",
    },

    metrics: {
      battery: { main: "#06b6d4", soft: "#67e8f9", bg: "#ecfeff" },
      motorTemp: { main: "#fb923c", soft: "#fed7aa", bg: "#fff7ed" },
      motorCurrent: { main: "#8b5cf6", soft: "#c4b5fd", bg: "#f5f3ff" },
      cpuLoad: { main: "#3b82f6", soft: "#bfdbfe", bg: "#eff6ff" },
      velocity: { main: "#14b8a6", soft: "#99f6e4", bg: "#f0fdfa" },
      pcTemperature: { main: "#ec4899", soft: "#fbcfe8", bg: "#fdf2f8" },
    },
  },

  card: {
    base: "bg-white rounded-xl border border-slate-200 shadow-sm",
    padding: "p-6",
    hover: "hover:shadow-md hover:border-slate-300 transition-all duration-200",
  },

  typography: {
    heading: {
      h1: "text-3xl font-semibold text-slate-900 tracking-tight",
      h2: "text-2xl font-semibold text-slate-900 tracking-tight",
      h3: "text-xl font-semibold text-slate-800",
    },
    label: "text-xs font-semibold text-slate-500 uppercase tracking-widest",
    body: "text-sm text-slate-600 leading-relaxed",
    caption: "text-xs text-slate-500",
    value: "text-2xl font-bold text-slate-900",
  },

  spacing: { card: "p-6", section: "mb-10", element: "mb-4" },

  shadow: { sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg shadow-slate-200/50" },

  radius: { sm: "rounded-md", md: "rounded-lg", lg: "rounded-xl", full: "rounded-full" },
};

export const getStatusColor = (value: number, thresholds: { good: number; warning: number; critical: number }) => {
  if (value >= thresholds.good) return theme.colors.status.good.main;
  if (value >= thresholds.warning) return theme.colors.status.warning.main;
  return theme.colors.status.critical.main;
};

export const getStatusText = (value: number, thresholds: { good: number; warning: number; critical: number }) => {
  if (value >= thresholds.good) return "Good";
  if (value >= thresholds.warning) return "Warning";
  return "Critical";
};