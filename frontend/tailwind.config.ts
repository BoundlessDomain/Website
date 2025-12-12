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
                    DEFAULT: "var(--primary)",
                    glow: "var(--primary-glow)",
                    text: "var(--primary-text)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    dark: "var(--secondary-dark)",
                },
                glass: "rgba(0, 0, 0, 0.4)",
            },
        },
    },
    plugins: [],
};
export default config;
