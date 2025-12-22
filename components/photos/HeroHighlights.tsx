"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import { getApiUrl } from "@/utils/api";

interface Highlight {
    id: string;
    type: 'image' | 'video';
    url: string;
    caption: string;
    albumId?: string;
}

interface HeroHighlightsProps {
    highlights: Highlight[];
    albums?: any[]; // Should be Album[] but keeping loose for now to match other data structures if needed
    onSelectHighlight?: (albumId: string, photoId: string) => void;
}

export default function HeroHighlights({ highlights, albums, onSelectHighlight }: HeroHighlightsProps) {
    const isOwner = useUIStore((state) => state.isOwner);
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    // Local state for shuffling
    const [displayHighlights, setDisplayHighlights] = useState<Highlight[]>([]);

    useEffect(() => {
        if (highlights) {
            setDisplayHighlights(highlights);
        }
    }, [highlights]);

    // Auto-rotate highlights every 5s
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffling, setShuffling] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (displayHighlights.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % displayHighlights.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [displayHighlights.length]);

    const handleShuffle = () => {
        setShuffling(true);

        // 1. Gather ALL photos from ALL albums
        if (albums && albums.length > 0) {
            const allPhotos: Highlight[] = [];
            albums.forEach(album => {
                if (album.photos) {
                    album.photos.forEach((photo: any) => {
                        allPhotos.push({
                            id: photo.id,
                            url: photo.url,
                            type: photo.type,
                            // Use Album Title as caption since raw photos don't have captions
                            caption: album.title,
                            albumId: album.id
                        });
                    });
                }
            });

            // 2. Pick 3 random unique photos
            // Simple shuffle of the massive array might be expensive if thousands of photos, 
            // but typical user gallery is fine.
            for (let i = allPhotos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allPhotos[i], allPhotos[j]] = [allPhotos[j], allPhotos[i]];
            }

            // Take top 3
            const newHighlights = allPhotos.slice(0, 3);
            setDisplayHighlights(newHighlights);
        } else {
            // Fallback to existing logic if no albums data
            const shuffled = [...displayHighlights];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setDisplayHighlights(shuffled);
        }

        setCurrentIndex(0);

        setTimeout(() => setShuffling(false), 500);
    };

    // Helper to get formatted date
    const getAlbumDate = (albumId?: string) => {
        if (!albumId || !albums) return null;
        const album = albums.find(a => a.id === albumId);
        if (!album?.date) return null;

        try {
            // Handle YYYY-MM-DD
            if (album.date.includes('-') && album.date.length === 10) {
                const [y, m, _] = album.date.split('-');
                return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                });
            }
            return new Date(album.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });
        } catch {
            return null;
        }
    };

    if (!displayHighlights || displayHighlights.length === 0) return null;

    // Use specific indices to create a masonry-style or featured grid
    const mainHighlight = displayHighlights[0];
    const secondaryHighlights = displayHighlights.slice(1, 3);

    return (
        <div className="w-full mb-8 relative group/section">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[500px]">
                {/* Main Feature (Left, 2/3 width on desktop) */}
                {/* key={currentIndex} removed to prevent flashing on tab focus / rotation */}
                <motion.div
                    // key={currentIndex} 
                    initial={isLowPowerMode ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={isLowPowerMode ? { duration: 0 } : { duration: 0.8 }}
                    className="md:col-span-2 h-full relative rounded-2xl overflow-hidden group border border-white/5 shadow-2xl cursor-pointer"
                    onClick={() => mainHighlight.albumId && onSelectHighlight?.(mainHighlight.albumId, mainHighlight.id)}
                    whileHover={!isLowPowerMode ? { scale: 0.99 } : undefined}
                >
                    {/* Render current main highlight based on rotation if needed, but for now we stick to static [0] unless logic changes */}
                    {/* Actually, the layout implies static positions for 1st, 2nd, 3rd items from the list.
                        The 'currentIndex' rotation logic was for a carousel, but the UI is a grid. 
                        If we want a carousel effect, we should rotate the 'highlights' array itself.
                        For now, let's keep the Grid consistent with the design.
                    */}
                    {mainHighlight.type === 'video' ? (
                        <video
                            src={`${getApiUrl()}/api/proxy?url=${encodeURIComponent(mainHighlight.url)}`}
                            className={clsx(
                                "w-full h-full object-cover",
                                !isLowPowerMode && "transition-transform duration-700 group-hover:scale-105"
                            )}
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={`${getApiUrl()}/api/proxy?url=${encodeURIComponent(mainHighlight.url)}`}
                            alt={mainHighlight.caption}
                            className={clsx(
                                "w-full h-full object-cover",
                                !isLowPowerMode && "transition-transform duration-700 group-hover:scale-105"
                            )}
                            loading="lazy"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-6 left-6">
                        <span className="text-secondary text-xs font-bold tracking-widest uppercase mb-1 block">Featured</span>
                        {getAlbumDate(mainHighlight.albumId) && (
                            <span className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1 block">
                                {getAlbumDate(mainHighlight.albumId)}
                            </span>
                        )}
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
                            {item.type === 'video' ? (
                                <video
                                    src={`${getApiUrl()}/api/proxy?url=${encodeURIComponent(item.url)}`}
                                    className={clsx(
                                        "w-full h-full object-cover",
                                        !isLowPowerMode && "transition-transform duration-700 group-hover:scale-110"
                                    )}
                                    muted
                                    loop
                                    playsInline
                                    // No autoplay for secondary to save resources? or on hover?
                                    onMouseOver={event => (event.target as HTMLVideoElement).play()}
                                    onMouseOut={event => (event.target as HTMLVideoElement).pause()}
                                />
                            ) : (
                                <img
                                    src={`${getApiUrl()}/api/proxy?url=${encodeURIComponent(item.url)}`}
                                    alt={item.caption}
                                    className={clsx(
                                        "w-full h-full object-cover",
                                        !isLowPowerMode && "transition-transform duration-700 group-hover:scale-110"
                                    )}
                                    loading="lazy"
                                />
                            )}
                            <div className={clsx(
                                "absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 transition-opacity",
                                !isLowPowerMode && "group-hover:opacity-80"
                            )} />
                            <div className="absolute bottom-4 left-4">
                                {getAlbumDate(item.albumId) && (
                                    <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1 block">
                                        {getAlbumDate(item.albumId)}
                                    </span>
                                )}
                                <p className="text-lg font-bold text-white">{item.caption}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
