"use client";

import { useUIStore } from "@/store/uiStore";
import { useEffect, useRef } from "react";

export default function MatrixBackground() {
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

        const katakana = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
        const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const nums = "0123456789";
        const alphabet = katakana + latin + nums;

        const fontSize = 16;
        const columns = width / fontSize;
        const rainDrops = Array.from({ length: Math.ceil(columns) }, () => 1);

        const draw = () => {
            if (!ctx) return;
            // Translucent black to create trail effect
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "#0F0";
            ctx.font = fontSize + "px monospace";

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

                if (rainDrops[i] * fontSize > height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        };

        const interval = setInterval(draw, 30);

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            // Re-calc columns
            const newCols = width / fontSize;
            // Pad array
            while (rainDrops.length < newCols) rainDrops.push(0);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", handleResize);
        };
    }, [isLowPowerMode]);

    if (isLowPowerMode) {
        return <div className="fixed inset-0 z-[-1] bg-[var(--background)]" />;
    }

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
            <canvas ref={canvasRef} className="opacity-20 translate-y-[-10px]" />
            {/* Overlay to dim specific areas if needed, or simple gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent" />
        </div>
    );
}
