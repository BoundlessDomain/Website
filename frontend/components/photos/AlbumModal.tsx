"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Calendar, Image as ImageIcon, Edit2, Plus, UploadCloud, Trash2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import clsx from "clsx";
import { supabase } from "@/utils/supabase";

interface Photo {
    id: string;
    url: string;
    type?: "image" | "video";
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

    // Local state to manage the album data without reloading
    // Initialize with prop to avoid initial null if possible, though parent checks usually ensure it
    const [currentAlbum, setCurrentAlbum] = useState<Album | null>(album);

    // Local state for inline editing
    const [title, setTitle] = useState(album?.title || "");
    const [date, setDate] = useState(album?.date || "");

    // Delete State
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    // Cover Selection State
    const [isSelectingCover, setIsSelectingCover] = useState(false);

    // File Upload Logic
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync state when album opens
    useEffect(() => {
        if (album) {
            // Only update if it's different to prevent loops/resets if we were already editing
            // But usually this effect is for when the modal *opens* or prop changes.
            // Since we init state from prop, this might be redundant for first render, but good for updates.
            if (!currentAlbum || currentAlbum.id !== album.id) {
                setCurrentAlbum(album);
                setTitle(album.title);
                setDate(album.date);

                // PRELOAD IMAGES: Download all photos client side for smoother scrolling
                album.photos.forEach(photo => {
                    if (photo.type !== "video") {
                        const img = new Image();
                        // Use Proxy
                        img.src = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/proxy?url=${encodeURIComponent(photo.url)}`;
                    }
                });
            }
        }
    }, [album, currentAlbum]);

    if (!currentAlbum) return null;

    const handleUpdate = async () => {
        if (title !== currentAlbum.title || date !== currentAlbum.date) {
            // Optimistic Update
            setCurrentAlbum(prev => prev ? ({ ...prev, title, date }) : null);

            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${currentAlbum.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, coverUrl: currentAlbum.coverUrl, date })
                });
            } catch (e) { console.error(e); }
        }
    };

    const handleEditCover = async () => {
        setIsSelectingCover(!isSelectingCover);
    };

    const handlePhotoClick = async (photo: Photo) => {
        if (isSelectingCover) {
            // Optimistic Update
            setCurrentAlbum(prev => prev ? ({ ...prev, coverUrl: photo.url }) : null);
            setIsSelectingCover(false);

            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${currentAlbum.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, coverUrl: photo.url, date })
                });
            } catch (e) {
                console.error(e);
            }
        } else {
            // Future lightbox logic
        }
    };

    const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening/selecting
        if (!confirm("Are you sure you want to delete this photo?")) return;

        // Optimistic Update: Remove instantaneously
        setCurrentAlbum(prev => prev ? ({
            ...prev,
            photos: prev.photos.filter(p => p.id !== photoId)
        }) : null);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${currentAlbum.id}/photos/${photoId}`, {
                method: 'DELETE',
            });
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (confirmText !== currentAlbum.title) return;

        try {
            await fetch(`http://localhost:8000/api/photos/albums/${currentAlbum.id}`, {
                method: 'DELETE',
            });
            window.location.reload(); // Deleting the whole album still warrants a refresh or navigation
        } catch (e) { console.error(e); }
    };

    // File Upload Logic
    // Upload State moved to top


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress({ current: 0, total: files.length });

        const filesArray = Array.from(files);
        const newPhotos: Photo[] = [];

        try {
            const uploadPromises = filesArray.map(async (file, i) => {
                const fileExt = file.name.split('.').pop();
                const fileType = file.type.startsWith('video/') ? 'video' : 'image';

                const folderName = currentAlbum.title.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
                const uniqueId = Math.random().toString(36).substring(7);
                const fileName = `${folderName}/${Date.now()}_${uniqueId}.${fileExt}`;

                // 1. Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from('gallery')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('gallery')
                    .getPublicUrl(fileName);

                // 3. Save to Backend
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${currentAlbum.id}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: publicUrl, type: fileType })
                });

                if (!res.ok) throw new Error(await res.text());

                // Collect new photo data (we need the ID from backend but for now generate temp or use what we returned)
                // To be accurate, we should get the ID from the response. The backend returns { "photo": { ... } }
                const data = await res.json();
                if (data.photo) {
                    newPhotos.push(data.photo);
                }

                setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
            });

            await Promise.all(uploadPromises);

            // Optimistic Update: Add new photos to grid
            setCurrentAlbum(prev => prev ? ({
                ...prev,
                photos: [...newPhotos, ...prev.photos] // Add new photos to top
            }) : null);

            setIsUploading(false);

        } catch (error: any) {
            console.error("Upload failed:", error);
            if (error.message?.includes("row-level security")) {
                alert("Upload failed: Permission denied (RLS).");
            } else {
                alert(`Some uploads failed: ${error.message}`);
            }
            setIsUploading(false);
        }
    };


    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className={clsx(
                    "absolute inset-0 bg-black/80",
                    !isLowPowerMode && "backdrop-blur-md"
                )}
                onClick={onClose}
            />

            <motion.div
                layoutId={!isLowPowerMode ? `album-card-${currentAlbum.id}` : undefined}
                initial={isLowPowerMode ? { opacity: 0 } : undefined}
                animate={isLowPowerMode ? { opacity: 1 } : undefined}
                exit={isLowPowerMode ? { opacity: 0 } : undefined}
                className="bg-black/90 border border-white/10 w-full max-w-[95vw] h-[90vh] rounded-3xl overflow-hidden relative z-[101] flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className={clsx(
                    "p-6 border-b border-white/10 flex justify-between items-center bg-black/50 sticky top-0 z-10 relative",
                    !isLowPowerMode && "backdrop-blur-md"
                )}>
                    {isDeleting ? (
                        <div className="flex-1 flex items-center justify-between animate-pulse bg-red-900/20 p-4 rounded-xl border border-red-500/50">
                            <div className="flex flex-col gap-1">
                                <span className="text-red-400 font-bold uppercase tracking-widest text-xs">Danger Zone</span>
                                <span className="text-white text-sm">Type <span className="font-bold text-white select-all">"{currentAlbum.title}"</span> to confirm deletion.</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder={currentAlbum.title}
                                    className="bg-black/50 border border-red-500/30 rounded px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleDelete}
                                    disabled={confirmText !== currentAlbum.title}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded flex items-center gap-2 transition-all"
                                >
                                    <Trash2 size={16} /> DELETE
                                </button>
                                <button onClick={() => { setIsDeleting(false); setConfirmText(""); }} className="p-2 text-white/50 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1">
                                <div className="flex flex-col gap-2">
                                    {/* Title (Inline Edit) */}
                                    {mounted && isOwner ? (
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onBlur={handleUpdate} // Auto-save
                                            className="text-3xl font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary outline-none w-full transition-colors"
                                        />
                                    ) : (
                                        <motion.h2 className="text-3xl font-bold text-white">{currentAlbum.title}</motion.h2>
                                    )}

                                    {/* Date (Inline Edit) */}
                                    <div className="flex items-center gap-4 text-white/50 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {mounted && isOwner ? (
                                                <input
                                                    type="text"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    onBlur={handleUpdate}
                                                    className="bg-transparent border-b border-white/10 focus:border-primary outline-none w-32 text-white"
                                                />
                                            ) : (
                                                date
                                            )}
                                        </span>
                                        <span className="flex items-center gap-1"><ImageIcon size={14} /> {currentAlbum.photos.length} Photos</span>
                                        {mounted && isOwner && (
                                            <>
                                                <button
                                                    onClick={handleEditCover}
                                                    className={clsx(
                                                        "flex items-center gap-1 transition-colors ml-2 px-2 py-0.5 rounded",
                                                        isSelectingCover ? "bg-primary text-black font-bold animate-pulse" : "text-primary hover:text-white"
                                                    )}
                                                >
                                                    <Edit2 size={12} /> {isSelectingCover ? "SELECT PHOTO..." : "Edit Cover"}
                                                </button>
                                                <button
                                                    onClick={() => setIsDeleting(true)}
                                                    className="flex items-center gap-1 text-red-500/50 hover:text-red-500 transition-colors ml-4"
                                                    title="Delete Album"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <X size={24} />
                            </button>
                        </>
                    )}
                </div>

                {/* Masonry Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {mounted && isOwner && !isSelectingCover && (
                            isUploading ? (
                                <div className="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-white/5 border border-white/5 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 p-8">
                                    <div className="flex flex-col items-center justify-center gap-3 w-full px-4">
                                        <div className="p-3 rounded-full bg-white/10 text-white">
                                            <UploadCloud size={24} className="animate-bounce" />
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-full transition-all duration-300"
                                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-white/50 tracking-wider">
                                            UPLOADING {uploadProgress.current}/{uploadProgress.total}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <label
                                    className="break-inside-avoid mb-4 block w-full rounded-xl overflow-hidden bg-white/5 border border-white/5 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group cursor-pointer p-8"
                                >
                                    <div className="p-3 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                        <UploadCloud size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-white/50">ADD MEDIA</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm"
                                        multiple
                                    />
                                </label>
                            )
                        )}
                        {currentAlbum.photos.map((photo, i) => (
                            <motion.div
                                key={photo.id}
                                layout
                                onClick={() => handlePhotoClick(photo)}
                                initial={isLowPowerMode ? { opacity: 1 } : { opacity: 0, y: 20 }}
                                animate={isLowPowerMode ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                transition={isLowPowerMode ? { duration: 0 } : { delay: i * 0.1 }}
                                className={clsx(
                                    "break-inside-avoid mb-4 block w-full rounded-xl overflow-hidden relative group cursor-pointer",
                                    isSelectingCover ? "border-2 border-primary hover:opacity-80 scale-[0.98] transition-all" : ""
                                )}
                            >
                                {isSelectingCover && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                        <span className="bg-primary text-black font-bold px-3 py-1 rounded-full text-xs shadow-lg">SET AS COVER</span>
                                    </div>
                                )}

                                {mounted && isOwner && !isSelectingCover && (
                                    <button
                                        onClick={(e) => handleDeletePhoto(photo.id, e)}
                                        className="absolute top-2 right-2 z-20 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Photo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                {photo.type === "video" ? (
                                    <div className="w-full relative group">
                                        <video
                                            src={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/proxy?url=${encodeURIComponent(photo.url)}`}
                                            className="w-full h-auto object-contain block"
                                            controls={!isSelectingCover}
                                            preload="metadata" // Optimisation: Don't auto-download heavy bits
                                            loop
                                            muted
                                            playsInline
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/proxy?url=${encodeURIComponent(photo.url)}`}
                                        className={clsx(
                                            "w-full h-auto object-contain block",
                                            !isLowPowerMode && !isSelectingCover && "transition-transform duration-500 group-hover:scale-105"
                                        )}
                                        loading="eager" // Optimisation: Load immediately since we are preloading anyway
                                    />
                                )}
                                <div className={clsx(
                                    "absolute inset-0 bg-black/0 transition-colors pointer-events-none rounded-xl",
                                    !isLowPowerMode && !isSelectingCover && "group-hover:bg-black/20"
                                )} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div >
        </div >
    );
}
