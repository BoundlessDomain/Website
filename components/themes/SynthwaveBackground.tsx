"use client";

import { useUIStore } from "@/store/uiStore";

export default function SynthwaveBackground() {
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    if (isLowPowerMode) {
        return <div className="fixed inset-0 z-[-1] bg-[var(--background)]" />;
    }

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#2e1065]">
            {/* Gradient Sky */}
            <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-[#172554] via-[#4c1d95] to-[#f472b6]/20" />

            {/* Retro Sun */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-32 h-32 md:w-64 md:h-64 rounded-full bg-gradient-to-t from-yellow-400 to-fuchsia-600 shadow-[0_0_40px_rgba(232,121,249,0.5)]">
                {/* Sun Stripes */}
                <div className="absolute bottom-0 inset-x-0 h-[50%] flex flex-col gap-1 md:gap-2">
                    <div className="h-[2px] bg-[#2e1065]/50 translate-y-1" />
                    <div className="h-[4px] bg-[#2e1065]/50 translate-y-2" />
                    <div className="h-[6px] bg-[#2e1065]/50 translate-y-4" />
                    <div className="h-[8px] bg-[#2e1065]/50 translate-y-6" />
                    <div className="h-[10px] bg-[#2e1065]/50 translate-y-8" />
                </div>
            </div>

            {/* Mountains */}
            <div className="absolute bottom-[35%] left-0 right-0 h-24 md:h-48 flex items-end justify-center pointer-events-none">
                <div className="w-[120%] flex items-end justify-between opacity-80">
                    <div className="w-[30%] h-full bg-[#3b0764] [clip-path:polygon(0%_100%,50%_0%,100%_100%)]" />
                    <div className="w-[50%] h-[80%] bg-[#4c1d95] [clip-path:polygon(0%_100%,30%_0%,60%_100%)] -ml-12" />
                    <div className="w-[40%] h-[120%] bg-[#581c87] [clip-path:polygon(0%_100%,60%_20%,100%_100%)] -ml-12" />
                </div>
            </div>

            {/* 3D Grid Plane */}
            <div className="absolute bottom-0 inset-x-0 h-[40%] overflow-hidden [perspective:1000px]">
                <div className="absolute inset-0 bg-[#2e1065] opacity-90" /> {/* Base floor color */}
                <div
                    className="absolute inset-[-100%] top-0 bg-[linear-gradient(transparent_95%,rgba(236,72,153,0.5)_2px),linear-gradient(90deg,transparent_95%,rgba(236,72,153,0.5)_2px)] [background-size:40px_40px] [transform:rotateX(60deg)_translateZ(-200px)] animate-grid-move origin-bottom"
                    style={{ animation: 'gridMove 20s linear infinite' }}
                />
                {/* Fade out grid at horizon */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#2e1065] to-transparent" />
            </div>

            <style jsx>{`
                @keyframes gridMove {
                    0% { transform: rotateX(60deg) translateY(0); }
                    100% { transform: rotateX(60deg) translateY(40px); }
                }
             `}</style>
        </div>
    );
}
