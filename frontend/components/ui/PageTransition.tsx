"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface PageTransitionProps {
    icon: LucideIcon;
    title: string;
    children: ReactNode;
}

export default function PageTransition({ icon: Icon, title, children }: PageTransitionProps) {
    const [isAnimating, setIsAnimating] = useState(true);

    return (
        <div className="min-h-screen w-full relative overflow-hidden pt-32 px-8 flex flex-col items-center">
            {/* 
               Header Animation:
               Starts perfectly centered (where the home animation left off).
               Moves to the top-left section standard position.
            */}
            <motion.div
                layout // Use layout animation for smooth position changes if structure changes
                initial={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%",
                    scale: 2
                }}
                animate={{
                    position: "absolute",
                    top: "128px", // Matches pt-32 (32 * 4 = 128px)
                    left: "32px", // Matches px-8
                    x: "0%",
                    y: "0%",
                    scale: 1
                }}
                transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1], // Custom ease-out
                    delay: 0.2
                }}
                className="flex items-center gap-4 z-10"
                onAnimationComplete={() => setIsAnimating(false)}
            >
                <Icon size={48} className="text-primary drop-shadow-[0_0_15px_var(--primary-glow)]" />
                <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_10px_var(--primary-glow)] tracking-widest">
                    {title}
                </h1>
            </motion.div>

            {/* Content Fades In ONLY after header moves */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }} // Wait for header to settle
                className="w-full max-w-4xl mt-32" // Add margin top to clear the absolute header
            >
                {children}
            </motion.div>
        </div>
    );
}
