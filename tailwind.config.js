/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/landing/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00d4aa",
          dark: "#0d0d1f",
          glow: "#00d4aa",
        },
      },
    },
  },
  plugins: [],
};
