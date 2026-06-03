/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   "#080c14",
          secondary: "#0d1321",
          elevated:  "#111827",
        },
        border: {
          subtle: "#1e2d40",
          glow:   "#00d4ff33",
        },
        accent: {
          cyan:    "#00d4ff",
          purple:  "#7c3aed",
          green:   "#00e676",
          orange:  "#ff9100",
          red:     "#ff1744",
          pink:    "#e040fb",
        },
        text: {
          primary:   "#e2e8f0",
          secondary: "#64748b",
          muted:     "#334155",
        },
        aqi: {
          good:      "#00e676",
          moderate:  "#ffea00",
          sensitive: "#ff9100",
          unhealthy: "#ff5252",
          very:      "#e040fb",
          hazardous: "#ff1744",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow:        "0 0 20px #00d4ff22",
        "glow-lg":   "0 0 40px #00d4ff33",
        "glow-purple": "0 0 20px #7c3aed33",
        card:        "0 4px 24px #00000066",
      },
      backgroundImage: {
        "gradient-cyan":   "linear-gradient(135deg, #00d4ff, #0073d7)",
        "gradient-purple": "linear-gradient(135deg, #7c3aed, #4f46e5)",
        "gradient-dark":   "linear-gradient(180deg, #080c14, #0d1321)",
        "grid-pattern":    "radial-gradient(circle, #1e2d40 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse":  "glowPulse 2s ease-in-out infinite",
        "fade-in":     "fadeIn 0.3s ease-out",
        "slide-up":    "slideUp 0.3s ease-out",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px #00d4ff22" },
          "50%":      { boxShadow: "0 0 40px #00d4ff55" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}