"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Palette, Check, Battery, ChevronLeft, Zap, ZapOff, Bug } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { themes, ThemeKey } from "@/utils/theme";
import { useUIStore } from "@/store/uiStore";
import clsx from "clsx";

export default function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [showThemes, setShowThemes] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [christmasBadge, setChristmasBadge] = useState(false);

    // HYDRATION FIX: Wait for mount to avoid mismatch on persisted store values
    useEffect(() => {
        setMounted(true);
        // Christmas Badge Logic (Dec 1 - Dec 25)
        const now = new Date();
        const year = now.getFullYear();
        const isChristmasTime = now.getMonth() === 11 && now.getDate() <= 25;
        const hasSeen = localStorage.getItem(`seen_christmas_theme_${year}`);

        if (isChristmasTime && !hasSeen) {
            setChristmasBadge(true);
        }
    }, []);

    const markSeen = () => {
        if (!christmasBadge) return;
        const year = new Date().getFullYear();
        localStorage.setItem(`seen_christmas_theme_${year}`, 'true');
        setChristmasBadge(false);
    };

    const { theme, setTheme } = useTheme();
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);
    const setLowPowerMode = useUIStore((state) => state.setLowPowerMode);
    const isDebugMode = useUIStore((state) => state.isDebugMode);
    const setDebugMode = useUIStore((state) => state.setDebugMode);
    const isOwner = useUIStore((state) => state.isOwner);

    if (!mounted) return null; // Or render a skeleton/simplistic button only

    return (
        <div className={clsx("relative pointer-events-auto", isOpen ? "z-50" : "z-auto")}>
            {/* Gear Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "p-3 rounded-full bg-black/40 backdrop-blur-md border border-primary/30 relative",
                    "hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_15px_var(--primary-glow)]",
                    "transition-all duration-300 group"
                )}
            >
                <Settings
                    size={24}
                    className={clsx(
                        "text-primary group-hover:text-white transition-colors duration-300",
                        isOpen && "rotate-90 text-white"
                    )}
                />
                {/* Outer Badge */}
                {christmasBadge && !isOpen && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-600 border border-black rounded-full shadow-md animate-bounce">
                        <span className="text-white text-[10px] font-bold">!</span>
                    </div>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Click-outside alignment overlay */}
                        <div
                            className="fixed inset-0 z-[90]"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-16 right-0 w-72 p-4 rounded-xl bg-black/95 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-[100]"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-white/10">
                                <Settings size={16} className="text-primary" />
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Settings</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {/* Low Power Mode Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {isLowPowerMode ? <ZapOff size={18} className="text-amber-400" /> : <Zap size={18} className="text-primary" />}
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">Low Power</span>
                                            <span className="text-[10px] text-white/50">Reduces animations</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setLowPowerMode(!isLowPowerMode)}
                                        className={clsx(
                                            "w-10 h-6 rounded-full p-1 transition-colors duration-300 relative",
                                            isLowPowerMode ? "bg-primary" : "bg-white/20"
                                        )}
                                    >
                                        <motion.div
                                            className="w-4 h-4 bg-white rounded-full shadow-md"
                                            animate={{ x: isLowPowerMode ? 16 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>

                                {/* Option: Debug Mode (Owner Only) */}
                                {isOwner && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {isDebugMode ? <Bug size={18} className="text-red-500" /> : <Bug size={18} className="text-white/40" />}
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">Debug Mode</span>
                                                <span className="text-[10px] text-white/50">Global override</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setDebugMode(!isDebugMode)}
                                            className={clsx(
                                                "w-10 h-6 rounded-full p-1 transition-colors duration-300 relative",
                                                isDebugMode ? "bg-red-500" : "bg-white/20"
                                            )}
                                        >
                                            <motion.div
                                                className="w-4 h-4 bg-white rounded-full shadow-md"
                                                animate={{ x: isDebugMode ? 16 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                    </div>
                                )}

                                {/* Theme Menu Trigger (Hover) */}
                                <div
                                    className="relative"
                                    onMouseEnter={() => {
                                        setShowThemes(true);
                                        markSeen();
                                    }}
                                    onMouseLeave={() => setShowThemes(false)}
                                >
                                    <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Palette size={18} className="text-primary group-hover:text-white transition-colors" />
                                            <span className="text-sm font-bold text-white">Themes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Inner Badge */}
                                            {christmasBadge && (
                                                <div className="w-4 h-4 flex items-center justify-center bg-red-600 rounded-full animate-pulse">
                                                    <span className="text-white text-[10px] font-bold">!</span>
                                                </div>
                                            )}
                                            <ChevronLeft size={16} className="text-white/50 group-hover:-translate-x-1 transition-transform" />
                                        </div>
                                    </button>

                                    {/* Nested Theme Menu (Files out to the LEFT) */}
                                    <AnimatePresence>
                                        {showThemes && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-0 right-full mr-4 w-60 p-2 rounded-xl bg-black/95 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    {(Object.keys(themes) as ThemeKey[]).map((key) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => setTheme(key)}
                                                            className={clsx(
                                                                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                                                theme === key
                                                                    ? "bg-primary/20 text-white border border-primary/50 shadow-[0_0_10px_var(--primary-glow)]"
                                                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                                            )}
                                                        >
                                                            <span>{themes[key].label}</span>
                                                            {theme === key && <Check size={14} className="text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
