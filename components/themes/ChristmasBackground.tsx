"use client";

import { useUIStore } from "@/store/uiStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ChristmasBackground() {
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    // Snow particles
    const [snowflakes, setSnowflakes] = useState<number[]>([]);

    useEffect(() => {
        setSnowflakes(Array.from({ length: 50 }, (_, i) => i));
    }, []);

    if (isLowPowerMode) {
        return <div className="fixed inset-0 z-[-1] bg-[#0f172a]" />;
    }

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0f172a]">
            {/* Gradient Sky (Evening) */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#334155]" />

            {/* Moon */}
            <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-100 rounded-full blur-[2px] opacity-80 shadow-[0_0_20px_rgba(255,255,200,0.5)]" />

            {/* Falling Snow */}
            {snowflakes.map((i) => (
                <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 100 + "%", opacity: 0 }}
                    animate={{
                        y: "110vh",
                        opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                        duration: Math.random() * 5 + 5, // 5-10s fall duration
                        repeat: Infinity,
                        delay: Math.random() * 10,
                        ease: "linear"
                    }}
                    className="absolute bg-white rounded-full opacity-80"
                    style={{
                        width: Math.random() * 4 + 2 + "px",
                        height: Math.random() * 4 + 2 + "px",
                        left: Math.random() * 100 + "%" // Initial randomization handled by motion x, but this helps static layout too
                    }}
                />
            ))}

            {/* Background Trees (Far) */}
            <div className="absolute bottom-[20%] left-0 right-0 h-40 flex items-end justify-around px-10 opacity-60">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div
                        key={`tree-far-${i}`}
                        className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[60px] border-l-transparent border-r-transparent border-b-[#064e3b] transform scale-y-[1.5]" // Dark Green
                        style={{ marginBottom: Math.random() * 20 + "px" }}
                    />
                ))}
            </div>

            {/* Rolling Hills / Snow Ground */}
            <div className="absolute bottom-0 inset-x-0 h-[30%] bg-[#f1f5f9] rounded-t-[50%] scale-x-150 translate-y-10" />

            {/* Frozen Lake */}
            <div className="absolute bottom-10 inset-x-[20%] h-24 bg-[#bfdbfe] rounded-[50%] opacity-80 blur-[1px] shadow-[0_0_20px_#93c5fd] scale-x-150" />

            {/* Foreground Trees (Near) */}
            <div className="absolute bottom-0 left-[-50px] w-0 h-0 border-l-[60px] border-r-[60px] border-b-[180px] border-l-transparent border-r-transparent border-b-[#14532d]" />
            <div className="absolute bottom-0 right-[-50px] w-0 h-0 border-l-[80px] border-r-[80px] border-b-[220px] border-l-transparent border-r-transparent border-b-[#14532d]" />

        </div>
    );
}
