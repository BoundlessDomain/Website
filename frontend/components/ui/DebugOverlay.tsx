"use client";

import { useUIStore } from "@/store/uiStore";
import { useEffect, useState } from "react";

export default function DebugOverlay() {
    const isDebugMode = useUIStore((state) => state.isDebugMode);
    const isOwner = useUIStore((state) => state.isOwner);
    const isLoginOpen = useUIStore((state) => state.isLoginOpen);
    const isLoggedIn = useUIStore((state) => state.isLoggedIn);

    // Memory Tracker
    const [memory, setMemory] = useState<string>("0 MB");

    useEffect(() => {
        if (!isDebugMode) return;

        const interval = setInterval(() => {
            // @ts-ignore - performance.memory is Chrome specific
            if (performance && performance.memory) {
                // @ts-ignore
                const used = performance.memory.usedJSHeapSize;
                setMemory((used / 1024 / 1024).toFixed(1) + " MB");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isDebugMode]);

    if (!isDebugMode) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[9999] bg-black/80 text-white p-3 rounded-lg text-xs pointer-events-none border border-white/10 shadow-xl font-mono">
            <h3 className="font-bold underline mb-1 text-primary">DEBUG MODE</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>Owner:</span> <span className={isOwner ? "text-green-400" : "text-red-400"}>{isOwner ? 'YES' : 'NO'}</span>
                <span>Logged In:</span> <span className={isLoggedIn ? "text-green-400" : "text-red-400"}>{isLoggedIn ? 'YES' : 'NO'}</span>
                <span>Login Modal:</span> <span>{isLoginOpen ? 'OPEN' : 'CLOSED'}</span>
                <span>Memory:</span> <span className="text-yellow-400">{memory}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/50">
                Overlay is Global & Persistent
            </div>
        </div>
    );
}
