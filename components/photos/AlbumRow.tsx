"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { Plus } from "lucide-react";
import clsx from "clsx";

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

import { getApiUrl } from "@/utils/api";

interface AlbumRowProps {
    albums: Album[];
    onSelectAlbum: (album: Album) => void;
    onAlbumCreate?: () => void;
}

export default function AlbumRow({ albums, onSelectAlbum, onAlbumCreate }: AlbumRowProps) {
    const isOwner = useUIStore((state) => state.isOwner);
    const [mounted, setMounted] = useState(false);

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

    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between border-b border-white/10 mb-8 pb-2 relative z-10">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-8">
                {albums.map((album) => (
                    <motion.div
                        key={album.id}
                        layoutId={!isLowPowerMode ? `album-card-${album.id}` : undefined}
                        onClick={() => onSelectAlbum(album)}
                        whileHover={!isLowPowerMode ? { y: -10 } : undefined}
                        className="cursor-pointer w-full"
                    >
                        <div className="aspect-square rounded-2xl overflow-hidden relative group border border-white/10 shadow-lg">
                            <img
                                src={album.coverUrl}
                                alt={album.title}
                                className={clsx(
                                    "w-full h-full object-cover",
                                    !isLowPowerMode && "transition-transform duration-500 group-hover:scale-110"
                                )}
                                loading="lazy"
                            />
                            <div className={clsx(
                                "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity",
                                !isLowPowerMode && "group-hover:opacity-90"
                            )} />

                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">{album.date}</p>
                                <h3 className="text-2xl font-bold text-white leading-tight">{album.title}</h3>
                                <p className="text-xs text-white/50 mt-2">{album.photos.length} Photos</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
