/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fcfaf6",
        panel: "#fffdfa",
        line: "#eadbc9",
        ink: "#2d241c",
        muted: "#8b7d6e",
        clay: "#cc4f2b",
        clayDark: "#ad3f21",
        sand: "#f4eadf"
      },
      boxShadow: {
        card: "0 12px 30px rgba(90, 62, 36, 0.06)",
        soft: "0 8px 18px rgba(90, 62, 36, 0.05)"
      },
      fontFamily: {
        serif: [
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "SimSun",
          "serif"
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};
