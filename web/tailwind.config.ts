import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#172117", forest: "#203a2b", cream: "#f5f1e7", brass: "#b28a47", line: "#d8d1c0" }, fontFamily: { display: ["var(--font-cormorant)"], sans: ["var(--font-manrope)"] } } },
  plugins: []
};
export default config;
