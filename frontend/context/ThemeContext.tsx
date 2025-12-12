"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { themes, ThemeKey, DEFAULT_THEME } from "@/utils/theme";

interface ThemeContextType {
    theme: ThemeKey;
    setTheme: (theme: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeKey>(DEFAULT_THEME);
    const [mounted, setMounted] = useState(false);

    // Initial Load & Persistence
    useEffect(() => {
        const saved = localStorage.getItem("theme") as ThemeKey;
        if (saved && themes[saved]) {
            setThemeState(saved);
        }
        setMounted(true);
    }, []);

    const setTheme = (newTheme: ThemeKey) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    // Apply CSS Variables
    useEffect(() => {
        const root = document.documentElement;
        const colors = themes[theme].colors;

        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }, [theme]);

    if (!mounted) {
        return <>{children}</>; // Render children to avoid layout shift, but colors might flicker briefly (or default)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
