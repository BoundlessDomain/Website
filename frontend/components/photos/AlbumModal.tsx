"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Calendar, Image as ImageIcon, Edit2, Plus, UploadCloud } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

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

interface AlbumModalProps {
    album: Album | null;
    onClose: () => void;
}

export default function AlbumModal({ album, onClose }: AlbumModalProps) {
    const isOwner = useUIStore((state) => state.isOwner);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!album) return null;

    const handleEditTitle = async () => {
        const newTitle = prompt("Edit Album Title:", album.title);
        if (newTitle && newTitle !== album.title) {
            await updateAlbum(album.id, newTitle, album.coverUrl);
        }
    };

    const handleEditCover = async () => {
        const newCover = prompt("Enter Cover Image URL:", album.coverUrl);
        if (newCover && newCover !== album.coverUrl) {
            await updateAlbum(album.id, album.title, newCover);
        }
    };

    const handleAddPhoto = async () => {
        const url = prompt("Enter Photo URL (or filename in Supabase):");
        if (url) {
            try {
                await fetch(`http://localhost:8000/api/photos/albums/${album.id}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                window.location.reload();
            } catch (e) { console.error(e); }
        }
    };

    const updateAlbum = async (id: string, title: string, coverUrl: string) => {
        try {
            await fetch(`http://localhost:8000/api/photos/albums/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, coverUrl })
            });
            window.location.reload();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <motion.div
                layoutId={`album-card-${album.id}`}
                className="bg-black/90 border border-white/10 w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden relative z-[101] flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-10 relative">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <motion.h2 className="text-3xl font-bold text-white">{album.title}</motion.h2>
                            {isOwner && (
                                <button onClick={handleEditTitle} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors">
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-white/50 text-sm mt-1">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {album.date}</span>
                            <span className="flex items-center gap-1"><ImageIcon size={14} /> {album.photos.length} Photos</span>
                            {isOwner && (
                                <button onClick={handleEditCover} className="flex items-center gap-1 text-primary hover:text-white transition-colors ml-2">
                                    <Edit2 size={12} /> Edit Cover
                                </button>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {isOwner && (
                            <button
                                onClick={handleAddPhoto}
                                className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group"
                            >
                                <div className="p-3 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                    <Plus size={24} />
                                </div>
                                <span className="text-sm font-bold text-white/50">ADD PHOTO</span>
                            </button>
                        )}
                        {album.photos.map((photo, i) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 relative group"
                            >
                                <img
                                    src={photo.url}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
