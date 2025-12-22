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
    // Background is now handled by BackgroundManager layout component

    // Responsive State
    const [layoutMode, setLayoutMode] = useState<'mobile' | 'narrow' | 'wide'>('wide');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setLayoutMode('mobile');
            } else if (width <= 1200) {
                setLayoutMode('narrow');
            } else {
                setLayoutMode('wide');
            }
        };

        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <main
            className="relative w-full h-screen min-h-[600px] overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-full z-0">
                <RobotScene layoutMode={layoutMode} />
            </div>
            <NavigationMenu layoutMode={layoutMode} />
        </main>
    );
}