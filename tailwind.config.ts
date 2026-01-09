import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#07090C",
          900: "#0B0F14",
          850: "#10161F"
        },
        jade: "#18D6C3",
        gold: "#E7C66A"
      },
      boxShadow: {
        glow: "0 0 30px rgba(24, 214, 195, 0.18)",
        gold: "0 0 30px rgba(231, 198, 106, 0.2)"
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(1200px circle at 20% 10%, rgba(24, 214, 195, 0.18), transparent 55%), radial-gradient(900px circle at 80% 20%, rgba(231, 198, 106, 0.12), transparent 50%)"
      }
    }
  },
  plugins: []
};

export default config;
