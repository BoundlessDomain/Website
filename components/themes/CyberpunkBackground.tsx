"use client";

import { useUIStore } from "@/store/uiStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CyberpunkBackground() {
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    // Randomize buildings only on mount to avoid hydration mismatch
    const [buildings, setBuildings] = useState<number[]>([]);

    useEffect(() => {
        // Generate random heights for buildings (20-60%)
        setBuildings(Array.from({ length: 40 }, () => Math.random() * 40 + 10));
    }, []);

    if (isLowPowerMode) {
        return <div className="fixed inset-0 z-[-1] bg-[var(--background)]" />;
    }

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#1e1b4b]">
            {/* Gradient Sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#312e81]" />

            {/* Stars */}
            <div className="absolute inset-0 opacity-50">
                {/* Generate some static stars for now, or use a pattern */}
                <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse" />
                <div className="absolute top-20 left-[20%] w-0.5 h-0.5 bg-cyan-300 rounded-full animate-pulse delay-75" />
                <div className="absolute top-[15%] left-[60%] w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-150" />
                <div className="absolute top-32 left-[80%] w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-300" />
                <div className="absolute top-[40%] left-[10%] w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-500" />
                {/* CSS Radial Gradient Stars for coverage */}
                <div className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:50px_50px] opacity-20" />
            </div>

            {/* Moving Cars (Flying) */}
            <div className="absolute inset-0">
                <motion.div
                    initial={{ x: "-10%" }}
                    animate={{ x: "110%" }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[20%] left-0 w-8 h-0.5 bg-cyan-400 blur-[1px] shadow-[0_0_5px_#22d3ee]"
                />
                <motion.div
                    initial={{ x: "110%" }}
                    animate={{ x: "-10%" }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
                    className="absolute top-[35%] right-0 w-6 h-0.5 bg-purple-500 blur-[1px] shadow-[0_0_5px_#a855f7]"
                />
                <motion.div
                    initial={{ x: "-10%" }}
                    animate={{ x: "110%" }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
                    className="absolute top-[50%] left-0 w-10 h-0.5 bg-blue-500 blur-[1px] shadow-[0_0_5px_#3b82f6]"
                />
            </div>

            {/* Cityscape Silhouette */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center px-4 opacity-80 space-x-[2px]">
                {buildings.map((height, i) => (
                    <div
                        key={i}
                        className="w-full bg-[#020617] relative group"
                        style={{ height: `${height}vh` }}
                    >
                        {/* Windows */}
                        <div className="absolute top-2 left-1 right-1 bottom-4 flex flex-col gap-2 overflow-hidden opacity-30">
                            {Math.random() > 0.5 && (
                                <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                            )}
                            {Math.random() > 0.7 && (
                                <div className="w-1 h-1 bg-purple-500 rounded-full self-end" />
                            )}
                        </div>
                        {/* Roof glow */}
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10" />
                    </div>
                ))}
            </div>

            {/* Foreground Fog/Glow */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none" />
        </div>
    );
}
