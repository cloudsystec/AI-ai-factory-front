/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#14b8a6",
          500: "#14b8a6",
          600: "#0d9488",
          dark: "#0d0d1f",
          glow: "#14b8a6",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "dash-caption": ["10px", { lineHeight: "14px" }],
        "dash-body": ["11px", { lineHeight: "16px" }],
        "dash-title": ["12px", { lineHeight: "16px" }],
        "dash-heading": ["13px", { lineHeight: "18px" }],
        "dash-value": ["14px", { lineHeight: "20px" }],
      },
    },
  },
  plugins: [],
};
