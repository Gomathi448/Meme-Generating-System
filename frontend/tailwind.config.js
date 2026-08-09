/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based light/dark toggling
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7C3AED", // Vibrant violet
          green: "#10B981",  // Lime/Emerald green
          pink: "#F43F5E",   // Neon pink
          dark: "#0F0F12",   // Carbon dark background
          lightDark: "#1E1E24" // Secondary dark layout
        }
      },
      fontFamily: {
        display: ["Outfit", "Impact", "sans-serif"],
        body: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-purple': '4px 4px 0px 0px #7C3AED',
        'brutal-green': '4px 4px 0px 0px #10B981',
      }
    },
  },
  plugins: [],
}
