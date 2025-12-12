"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Palette, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { themes, ThemeKey } from "@/utils/theme";
import clsx from "clsx";

export default function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    return (
        <div className="relative pointer-events-auto">
            {/* Gear Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "p-3 rounded-full bg-black/40 backdrop-blur-md border border-cyan-500/30",
                    "hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
                    "transition-all duration-300 group"
                )}
            >
                <Settings
                    size={24}
                    className={clsx(
                        "text-cyan-400 group-hover:text-white transition-colors duration-300",
                        isOpen && "rotate-90 text-white"
                    )}
                />
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
                            className="absolute top-16 right-0 w-64 p-4 rounded-xl bg-black/95 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
                        >
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                                <Palette size={16} className="text-cyan-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-widest">System Theme</span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {(Object.keys(themes) as ThemeKey[]).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setTheme(key)}
                                        className={clsx(
                                            "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                            theme === key
                                                ? "bg-cyan-500/20 text-white border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                                : "text-white/60 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <span>{themes[key].label}</span>
                                        {theme === key && <Check size={14} className="text-cyan-400" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
