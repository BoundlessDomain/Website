"use client";

import { useUIStore } from "@/store/uiStore";
import { motion } from "framer-motion";

export default function SunsetBackground() {
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    if (isLowPowerMode) {
        return <div className="fixed inset-0 z-[-1] bg-[var(--background)]" />;
    }

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#451a03]">
            {/* Sky Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#7c2d12] via-[#ea580c] to-[#fcd34d]" />

            {/* Sun */}
            <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-t from-[#f59e0b] to-[#fef3c7] blur-md shadow-[0_0_60px_rgba(251,191,36,0.5)]" />

            {/* Ocean */}
            <div className="absolute bottom-0 inset-x-0 h-[35%] bg-[#0c4a6e] overflow-hidden">
                {/* Reflection of Sun */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-full bg-gradient-to-b from-[#fbbf24]/30 to-transparent blur-xl" />

                {/* Waves Layers */}
                {/* Back Wave */}
                <motion.div
                    animate={{ x: ["-25%", "0%"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 left-0 w-[200%] h-32 bg-[#0ea5e9]/40 rounded-[50%_50%_0_0_/_100%_100%_0_0]"
                />

                {/* Middle Wave */}
                <motion.div
                    animate={{ x: ["0%", "-25%"] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-6 left-0 w-[200%] h-32 bg-[#0284c7]/60 rounded-[50%_50%_0_0_/_100%_100%_0_0]"
                />

                {/* Front Wave */}
                <motion.div
                    animate={{ x: ["-20%", "0%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-2 left-0 w-[200%] h-32 bg-[#0369a1] rounded-[50%_50%_0_0_/_100%_100%_0_0]"
                />
            </div>

            {/* Overlay Gradient for integration */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#451a03]/50 pointer-events-none" />
        </div>
    );
}
