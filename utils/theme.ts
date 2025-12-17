export const themes = {
    cyberpunk: {
        label: "Cyberpunk",
        colors: {
            primary: "#06b6d4",        // Cyan-500
            "primary-glow": "rgba(6,182,212,0.5)",
            "primary-text": "#22d3ee", // Cyan-400
            secondary: "#3b82f6",      // Blue-500
            "secondary-dark": "#1d4ed8", // Blue-700
            background: "#020617",     // Slate-950
            "robot-body": "#a855f7",   // Purple
            "robot-details": "#00ffff", // Cyan
            "robot-metal": "#64748b",  // Slate
        }
    },
    matrix: {
        label: "Matrix",
        colors: {
            primary: "#22c55e",        // Green-500
            "primary-glow": "rgba(34,197,94,0.5)",
            "primary-text": "#4ade80", // Green-400
            secondary: "#15803d",      // Green-700
            "secondary-dark": "#14532d", // Green-900
            background: "#050505",     // Blackish
            "robot-body": "#166534",   // Green
            "robot-details": "#00ff00", // Bright Green
            "robot-metal": "#27272a",  // Zinc
        }
    },
    synthwave: {
        label: "Synthwave",
        colors: {
            primary: "#d946ef",        // Fuchsia-500
            "primary-glow": "rgba(217,70,239,0.5)",
            "primary-text": "#f0abfc", // Fuchsia-300
            secondary: "#8b5cf6",      // Violet-500
            "secondary-dark": "#4c1d95", // Violet-900
            background: "#2a043b",     // Deep Purple
            "robot-body": "#db2777",   // Pink
            "robot-details": "#3b82f6", // Blue
            "robot-metal": "#4c1d95",  // Violet
        }
    },
    sunset: {
        label: "Sunset Omni",
        colors: {
            primary: "#f97316",        // Orange-500
            "primary-glow": "rgba(249,115,22,0.5)",
            "primary-text": "#fdba74", // Orange-300
            secondary: "#ef4444",      // Red-500
            "secondary-dark": "#991b1b", // Red-800
            background: "#431407",     // Brown
            "robot-body": "#ea580c",   // Orange
            "robot-details": "#fbbf24", // Amber
            "robot-metal": "#78350f",  // Brown
        }
    },
    glacier: {
        label: "Ice Glacier",
        colors: {
            primary: "#e2e8f0",        // Slate-200
            "primary-glow": "rgba(255,255,255,0.4)",
            "primary-text": "#f8fafc", // Slate-50
            secondary: "#94a3b8",      // Slate-400
            "secondary-dark": "#64748b", // Slate-500
            background: "#0f172a",     // Slate-900
            "robot-body": "#cbd5e1",   // Slate-300
            "robot-details": "#38bdf8", // Sky
            "robot-metal": "#94a3b8",  // Slate-400
        }
    }
};

export type ThemeKey = keyof typeof themes;
export const DEFAULT_THEME: ThemeKey = 'cyberpunk';
