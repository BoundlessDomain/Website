"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useUIStore } from "@/store/uiStore";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { getApiUrl } from "@/utils/api";

interface Photo {
    id: string;
    url: string;
}

interface Album {
    id: string;
    title: string;
    coverUrl: string;
    date: string;
    photos: Photo[];
}

interface AlbumRowProps {
    albums: Album[];
    onSelectAlbum: (album: Album) => void;
    onAlbumCreate?: () => void;
}

export default function AlbumRow({ albums, onSelectAlbum, onAlbumCreate }: AlbumRowProps) {
    const isOwner = useUIStore((state) => state.isOwner);
    const [mounted, setMounted] = useState(false);
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreateAlbum = async () => {
        const title = prompt("Enter Album Title:");
        if (!title) return;

        try {
            await fetch(`${getApiUrl()}/api/gallery/albums`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, coverUrl: "" })
            });
            onAlbumCreate?.();
        } catch (e) {
            console.error(e);
        }
    };

    // Masonry Logic (3 Columns)
    const { col1, col2, col3 } = useMemo(() => {
        const c1: Album[] = [];
        const c2: Album[] = [];
        const c3: Album[] = [];
        let h1 = 0;
        let h2 = 0;
        let h3 = 0;

        albums.forEach((album) => {
            // Heuristic: Base 100 + Title length * 1 + Image (assume 300 for calculation balance)
            const estimatedHeight = 100 + (album.title.length * 1) + 300;

            // Find shortest column
            if (h1 <= h2 && h1 <= h3) {
                c1.push(album);
                h1 += estimatedHeight;
            } else if (h2 <= h1 && h2 <= h3) {
                c2.push(album);
                h2 += estimatedHeight;
            } else {
                c3.push(album);
                h3 += estimatedHeight;
            }
        });

        return { col1: c1, col2: c2, col3: c3 };
    }, [albums]);

    const renderAlbumCard = (album: Album) => (
        <motion.div
            key={album.id}
            layoutId={!isLowPowerMode ? `album-card-${album.id}` : undefined}
            onClick={() => onSelectAlbum(album)}
            whileHover={!isLowPowerMode ? { y: -10 } : undefined}
            className="cursor-pointer w-full mb-6 break-inside-avoid"
        >
            <div className="rounded-2xl overflow-hidden relative group border border-white/10 shadow-lg">
                <img
                    src={album.coverUrl}
                    alt={album.title}
                    className={clsx(
                        "w-full h-auto object-contain bg-black/50 block", // Removed object-cover, ensured block
                        !isLowPowerMode && "transition-transform duration-500 group-hover:scale-110"
                    )}
                    loading="lazy"
                />
                <div className={clsx(
                    "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity",
                    !isLowPowerMode && "group-hover:opacity-90"
                )} />

                <div className="absolute bottom-0 left-0 p-6 w-full">
                    <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">
                        {(() => {
                            if (!album.date) return '';
                            try {
                                const date = new Date(album.date);
                                if (album.date.includes('-') && album.date.length === 10) {
                                    const [y, m, _] = album.date.split('-');
                                    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long'
                                    });
                                }
                                return date.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long'
                                });
                            } catch (e) {
                                return album.date;
                            }
                        })()}
                    </p>
                    <h3 className="text-2xl font-bold text-white leading-tight">{album.title}</h3>
                    <p className="text-xs text-white/50 mt-2">{album.photos.length} Photos</p>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="w-full pt-8 pb-12 relative z-10">
            <div className="flex items-center justify-between border-b border-white/10 mb-8 pb-2">
                <h2 className="text-2xl font-bold text-white tracking-widest">
                    ALBUMS
                </h2>
                {mounted && isOwner && (
                    <button
                        onClick={handleCreateAlbum}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-sm font-bold"
                    >
                        <Plus size={16} /> NEW ALBUM
                    </button>
                )}
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 items-start">
                <div className="space-y-6">
                    {col1.map(renderAlbumCard)}
                </div>
                <div className="space-y-6">
                    {col2.map(renderAlbumCard)}
                </div>
                <div className="space-y-6">
                    {col3.map(renderAlbumCard)}
                </div>
            </div>
        </div>
    );
}
