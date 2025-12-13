import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useRouter } from "next/navigation";

interface PageTransitionProps {
    icon: LucideIcon;
    title: string;
    children: ReactNode;
    quadrant?: 'top-left' | 'mid-left' | 'btm-left' | 'top-right' | 'mid-right' | 'btm-right';
}

export default function PageTransition({ icon: Icon, title, children, quadrant = 'top-left' }: PageTransitionProps) {
    const router = useRouter();
    const isExiting = useUIStore((state) => state.isExiting);
    // const setIsExiting = useUIStore((state) => state.setIsExiting); // This was missing in replacing block, ensure we keep what we need
    const setIsExiting = useUIStore((state) => state.setIsExiting);
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode); // Added

    // Initial State: Centered and Scaled Up (Entry)
    // Target State: Top Left Standard Header
    // Exit State: Move towards original quadrant and shrink

    // Define standard "Home" positions for quadrants (relative to center)
    // These approximate the position of the menu items on the home screen
    const getExitTarget = () => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

        switch (quadrant) {
            case 'top-left': return { x: -vw * 0.35, y: -vh * 0.25 }; // Articles
            case 'mid-left': return { x: -vw * 0.40, y: 0 };          // Recipes
            case 'btm-left': return { x: -vw * 0.35, y: vh * 0.25 };  // Photos
            case 'top-right': return { x: vw * 0.35, y: -vh * 0.25 }; // Poems
            case 'mid-right': return { x: vw * 0.40, y: 0 };          // Stories
            case 'btm-right': return { x: vw * 0.35, y: vh * 0.25 };  // About
            default: return { x: 0, y: 0 };
        }
    };

    const exitTarget = getExitTarget();

    useEffect(() => {
        if (isExiting) {
            // Animation is handled by the variants below.
            // We just wait for it to visually finish before redirecting.
            // Duration is 0.8s, so we wait 800ms.
            // Low Power Mode: Instant redirect delay
            const delay = isLowPowerMode ? 0 : 800;
            const timer = setTimeout(() => {
                router.push("/");
                // Reset flag after a delay to ensure next nav is clean
                setTimeout(() => setIsExiting(false), 500);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isExiting, router, setIsExiting, isLowPowerMode]);

    return (
        <div className="min-h-screen w-full relative overflow-hidden pt-32 px-8 flex flex-col items-center">
            {/* 
               Header Animation
            */}
            <motion.div
                initial={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%",
                    scale: 2,
                    opacity: 1
                }}
                animate={isExiting ? {
                    // EXITING: Move to CENTER and shrink to nothing
                    // This mimics going back into the robot's hands/chest
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%",
                    scale: 0,
                    opacity: 0
                } : {
                    // ENTERED / NORMAL: Standard Header Position
                    position: "absolute",
                    top: "128px",
                    left: "32px",
                    x: "0%",
                    y: "0%",
                    scale: 1,
                    opacity: 1
                }}
                transition={{
                    duration: isLowPowerMode ? 0 : 0.8,
                    ease: [0.16, 1, 0.3, 1]
                }}
                className="flex items-center gap-4 z-10"
            >
                <Icon size={48} className="text-primary drop-shadow-[0_0_15px_var(--primary-glow)]" />
                <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_10px_var(--primary-glow)] tracking-widest">
                    {title}
                </h1>
            </motion.div>

            {/* Content Body */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isExiting ? { opacity: 0, y: 50 } : { opacity: 1, y: 0 }}
                transition={{ duration: isLowPowerMode ? 0 : 0.5, delay: (isExiting || isLowPowerMode) ? 0 : 0.8 }}
                className="w-full max-w-4xl mt-32"
            >
                {children}
            </motion.div>
        </div>
    );
}
