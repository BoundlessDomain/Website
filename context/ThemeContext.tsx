"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { themes, ThemeKey, DEFAULT_THEME } from "@/utils/theme";
import { supabase } from "@/utils/supabase";

import DebugOverlay from "@/components/ui/DebugOverlay";

interface ThemeContextType {
    theme: ThemeKey;
    setTheme: (theme: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeKey>(DEFAULT_THEME);
    const [mounted, setMounted] = useState(false);

    // Initial Load & Auth Sync
    useEffect(() => {
        // 1. Check LocalStorage first for instant load
        const saved = localStorage.getItem("theme") as ThemeKey;
        if (saved && themes[saved]) {
            setThemeState(saved);
        }
        setMounted(true);

        // 2. Listen for Auth Changes (Sync with Cloud)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // User logged in: Load their saved theme
                const userTheme = session.user.user_metadata?.theme as ThemeKey;
                if (userTheme && themes[userTheme]) {
                    setThemeState(userTheme);
                    // Also update local storage to match
                    localStorage.setItem("theme", userTheme);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const setTheme = async (newTheme: ThemeKey) => {
        // 1. Instant UI Update
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);

        // 2. Persist to Cloud if Logged In
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.auth.updateUser({
                data: { theme: newTheme }
            });
        }
    };

    // Apply CSS Variables
    useEffect(() => {
        const root = document.documentElement;
        const colors = themes[theme].colors;

        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <DebugOverlay />
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
