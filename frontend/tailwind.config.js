/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crmDark: "#0B0F19",
        crmCard: "#111827",
        crmCardHover: "#1F2937",
        crmBorder: "#1F2937",
        crmAccent: "#6366F1",
        crmAccentHover: "#4F46E5",
      }
    },
  },
  plugins: [],
}
