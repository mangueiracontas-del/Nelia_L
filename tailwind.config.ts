import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vermelho-alaranjado vibrante (apetite + ação)
        primary: {
          DEFAULT: "#E8490F",
          dark: "#C23A0A",
          light: "#FF6B35",
        },
        // Amarelo suave / Ouro (conversão)
        gold: {
          DEFAULT: "#F5B841",
          light: "#FFD97A",
        },
        // Dark mode do app do cliente
        ink: {
          DEFAULT: "#0E0E10",
          soft: "#17171A",
          card: "#1E1E23",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
