import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#06b6d4",
                    glow: "rgba(6,182,212,0.5)",
                    text: "#22d3ee",
                },
                secondary: {
                    DEFAULT: "#3b82f6",
                    dark: "#1d4ed8",
                },
                glass: "rgba(0, 0, 0, 0.4)",
            },
        },
    },
    plugins: [],
};
export default config;
