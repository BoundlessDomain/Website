'use client';

import dynamic from 'next/dynamic';
import NavigationMenu from "@/components/ui/NavigationMenu";

// Lazy load the robot scene and DISABLE server-side rendering
const RobotScene = dynamic(() => import('@/components/canvas/RobotScene'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-950" /> // Optional loading placeholder
});

export default function Home() {
    return (
        <main className="relative w-full h-screen bg-slate-950 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full z-0">
                <RobotScene />
            </div>
            <NavigationMenu />
        </main>
    );
}