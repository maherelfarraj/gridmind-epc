import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gridmind: {
          navy: "#002B49",
          orange: "#FF8C00",
          slate: "#1F2937",
          mist: "#F4F6F8"
        }
      }
    }
  },
  plugins: []
};

export default config;
