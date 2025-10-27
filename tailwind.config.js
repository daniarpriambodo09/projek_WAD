/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // gunakan .dark untuk mengaktifkan dark mode
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // pastikan utilitas yang didefinisikan di globals.css tidak ter-purge
    "border-border",
    "outline-ring/50",
    "bg-background",
    "text-foreground",
    "animate-fade-in",
    "animate-slide-in",
  ],
  theme: {
    extend: {
      // peta warna yang menggunakan CSS variables (mendukung alpha)
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        "card-foreground": "rgb(var(--color-card-foreground) / <alpha-value>)",
        popover: "rgb(var(--color-popover) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        destructive: "rgb(var(--color-destructive) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        input: "rgb(var(--color-input) / <alpha-value>)",
        ring: "rgb(var(--color-ring) / <alpha-value>)",
        "chart-1": "rgb(var(--color-chart-1) / <alpha-value>)",
        "chart-2": "rgb(var(--color-chart-2) / <alpha-value>)",
        "chart-3": "rgb(var(--color-chart-3) / <alpha-value>)",
        "chart-4": "rgb(var(--color-chart-4) / <alpha-value>)",
        "chart-5": "rgb(var(--color-chart-5) / <alpha-value>)",
        sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",
      },

      // gunakan radius dari CSS variable
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
      },

      // contoh ringColor default yang menggunakan CSS variable
      ringColor: {
        DEFAULT: "rgb(var(--color-ring) / <alpha-value>)",
      },
    },
  },
  plugins: [
    require("tw-animate"),
    // jika butuh plugin lain (forms, typography), tambahkan di sini:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
