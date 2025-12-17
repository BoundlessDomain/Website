"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";

interface Highlight {
    id: string;
    type: 'image' | 'video';
    url: string;
    caption: string;
    albumId?: string;
}

interface HeroHighlightsProps {
    highlights: Highlight[];
    onSelectHighlight?: (albumId: string, photoId: string) => void;
}

export default function HeroHighlights({ highlights, onSelectHighlight }: HeroHighlightsProps) {
    const isOwner = useUIStore((state) => state.isOwner);
    const [shuffling, setShuffling] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleShuffle = async () => {
        setShuffling(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/highlights/shuffle`, { method: "POST" });
            window.location.reload(); // Simple reload to fetch new data
        } catch (e) {
            console.error(e);
        }
        setShuffling(false);
    };

    if (!highlights || highlights.length === 0) return null;

    // Use specific indices to create a masonry-style or featured grid
    const mainHighlight = highlights[0];
    const secondaryHighlights = highlights.slice(1, 3);

    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    return (
        <div className="w-full mb-12 relative group/section">
            <div className="flex items-center justify-between border-b border-white/10 mb-6 pb-2">
                <h2 className="text-2xl font-bold text-white tracking-widest">
                    HIGHLIGHTS
                </h2>
                {mounted && isOwner && (
                    <button
                        onClick={handleShuffle}
                        disabled={shuffling}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
                        title="Shuffle Highlights"
                    >
                        <RefreshCw size={20} className={shuffling ? "animate-spin" : ""} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
                {/* Main Feature (Left, 2/3 width on desktop) */}
                <motion.div
                    initial={isLowPowerMode ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={isLowPowerMode ? { duration: 0 } : { duration: 0.8 }}
                    className="md:col-span-2 h-full relative rounded-2xl overflow-hidden group border border-white/5 shadow-2xl cursor-pointer"
                    onClick={() => mainHighlight.albumId && onSelectHighlight?.(mainHighlight.albumId, mainHighlight.id)}
                    whileHover={!isLowPowerMode ? { scale: 0.99 } : undefined}
                >
                    <img
                        src={mainHighlight.url}
                        alt={mainHighlight.caption}
                        className={clsx(
                            "w-full h-full object-cover",
                            !isLowPowerMode && "transition-transform duration-700 group-hover:scale-105"
                        )}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-6 left-6">
                        <span className="text-secondary text-xs font-bold tracking-widest uppercase mb-2 block">Featured</span>
                        <h3 className="text-4xl font-bold text-white">{mainHighlight.caption}</h3>
                    </div>
                </motion.div>

                {/* Secondary Column (Right, 1/3 width) */}
                <div className="flex flex-col gap-4 h-full">
                    {secondaryHighlights.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={isLowPowerMode ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={isLowPowerMode ? { duration: 0 } : { duration: 0.5, delay: 0.2 + (i * 0.2) }}
                            className="flex-1 relative rounded-2xl overflow-hidden group border border-white/5 cursor-pointer"
                            onClick={() => item.albumId && onSelectHighlight?.(item.albumId, item.id)}
                            whileHover={!isLowPowerMode ? { scale: 0.98 } : undefined}
                        >
                            <img
                                src={item.url}
                                alt={item.caption}
                                className={clsx(
                                    "w-full h-full object-cover",
                                    !isLowPowerMode && "transition-transform duration-700 group-hover:scale-110"
                                )}
                            />
                            <div className={clsx(
                                "absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 transition-opacity",
                                !isLowPowerMode && "group-hover:opacity-80"
                            )} />
                            <div className="absolute bottom-4 left-4">
                                <p className="text-lg font-bold text-white">{item.caption}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
