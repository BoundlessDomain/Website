"use client";

import { useUIStore } from "@/store/uiStore";
import { useEffect, useRef } from "react";

export default function GlacierBackground() {
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isLowPowerMode) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: { x: number; y: number; radius: number; speed: number; wind: number }[] = [];
        const particleCount = 100;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                speed: Math.random() * 1 + 0.5,
                wind: Math.random() * 0.5 - 0.25
            });
        }

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                ctx.moveTo(p.x, p.y);
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

                p.y += p.speed;
                p.x += p.wind;

                if (p.y > height) {
                    p.y = 0;
                    p.x = Math.random() * width;
                }
                if (p.x > width) p.x = 0;
                if (p.x < 0) p.x = width;
            }
            ctx.fill();
            requestAnimationFrame(draw);
        };

        let animationFrameId = requestAnimationFrame(draw);

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, [isLowPowerMode]);

    if (isLowPowerMode) return null;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0f172a]">
            {/* Sky Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1e293b] via-[#334155] to-[#cbd5e1]/20" />

            {/* Snow Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 opacity-60" />

            {/* Glaciers */}
            <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 flex items-end justify-center pointer-events-none">
                <div className="w-[120%] flex items-end justify-between opacity-90">
                    {/* Back Layer */}
                    <div className="w-[40%] h-[80%] bg-[#475569] [clip-path:polygon(0%_100%,40%_0%,100%_100%)] translate-x-10" />
                    <div className="w-[50%] h-[100%] bg-[#64748b] [clip-path:polygon(0%_100%,50%_10%,100%_100%)] -translate-x-10" />

                    {/* Front Layer */}
                    <div className="absolute bottom-0 left-0 w-[100%] h-[60%] bg-[#94a3b8] [clip-path:polygon(0%_100%,20%_20%,45%_100%,60%_40%,80%_100%,90%_50%,100%_100%)] opacity-80" />
                </div>
            </div>

            {/* Icy Fog Effect */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white/10 to-transparent blur-xl" />
        </div>
    );
}
