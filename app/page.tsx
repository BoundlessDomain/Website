'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import NavigationMenu from "@/components/ui/NavigationMenu";
import { useTheme } from '@/context/ThemeContext';
import { themes } from '@/utils/theme';

// Lazy load the robot scene and DISABLE server-side rendering
const RobotScene = dynamic(() => import('@/components/canvas/RobotScene'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-slate-900 flex items-center justify-center">
            <span className="text-cyan-500 font-bold tracking-widest animate-pulse">LOADING 3D SCENE...</span>
        </div>
    )
});

export default function Home() {
    const { theme } = useTheme();
    // Get background from current theme, or fallback to default
    const bgColor = themes[theme]?.colors.background || "#0f172a";

    // Mobile detection for robot positioning
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <main
            className="relative w-full h-screen overflow-hidden transition-colors duration-700"
            style={{ backgroundColor: bgColor }}
        >
            <div className="absolute top-0 left-0 w-full h-full z-0">
                <RobotScene floorColor={bgColor} shiftRight={isMobile} />
            </div>
            <NavigationMenu />
        </main>
    );
}