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

    // Local state for inline editing
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");

    // Delete State
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync state when album opens
    useEffect(() => {
        if (album) {
            setTitle(album.title);
            setDate(album.date);
        }
    }, [album]);

    if (!album) return null;

    const handleUpdate = async () => {
        if (title !== album.title || date !== album.date) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${album.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, coverUrl: album.coverUrl, date })
                });
                // No reload needed if we just want to save, but to reflect globally we might want to?
                // For smoother UX, we just let it save silently or with a toast.
                // But since the parent list needs updating, reload is safest for MVP.
                window.location.reload();
            } catch (e) { console.error(e); }
        }
    };

    // Cover Selection State
    const [isSelectingCover, setIsSelectingCover] = useState(false);

    const handleEditCover = async () => {
        setIsSelectingCover(!isSelectingCover);
    };

    const handlePhotoClick = async (photo: Photo) => {
        if (isSelectingCover) {
            // Set as cover
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${album.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, coverUrl: photo.url, date })
                });
                window.location.reload();
            } catch (e) {
                console.error(e);
            }
        } else {
            // Future lightbox logic or nothing
        }
    };

    const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening/selecting
        if (!confirm("Are you sure you want to delete this photo?")) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${album.id}/photos/${photoId}`, {
                method: 'DELETE',
            });
            window.location.reload();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (confirmText !== album.title) return;

        try {
            await fetch(`http://localhost:8000/api/photos/albums/${album.id}`, {
                method: 'DELETE',
            });
            window.location.reload();
        } catch (e) { console.error(e); }
    };

    // File Upload Logic (Stub)
    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress({ current: 0, total: files.length });
        console.log(`Starting parallel upload of ${files.length} files...`);

        // Convert FileList to Array
        const filesArray = Array.from(files);

        try {
            // Map each file to a Promise
            const uploadPromises = filesArray.map(async (file, i) => {
                const fileExt = file.name.split('.').pop();
                const fileType = file.type.startsWith('video/') ? 'video' : 'image';

                // Unique filename
                const folderName = album.title.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
                const uniqueId = Math.random().toString(36).substring(7); // Extra randomness for parallel safety
                const fileName = `${folderName}/${Date.now()}_${uniqueId}.${fileExt}`;

                console.log(`[File ${i}] Starting: ${file.name}`);

                // 1. Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from('gallery')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error(`[File ${i}] Supabase Error:`, uploadError);
                    throw uploadError;
                }

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('gallery')
                    .getPublicUrl(fileName);

                // 3. Save to Backend
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photos/albums/${album.id}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: publicUrl, type: fileType })
                });

                if (!res.ok) {
                    const errText = await res.text();
                    console.error(`[File ${i}] Backend Error:`, errText);
                    throw new Error(errText);
                }

                // Update Progress safely
                setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
                console.log(`[File ${i}] Completed`);
            });

            // Execute all seamlessly
            await Promise.all(uploadPromises);

            console.log("All parallel uploads complete!");
            window.location.reload();

        } catch (error: any) {
            console.error("One or more uploads failed:", error);
            if (error.message?.includes("row-level security")) {
                alert("Upload failed: Permission denied (RLS). Check Supabase policies.");
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
                layoutId={!isLowPowerMode ? `album-card-${album.id}` : undefined}
                initial={isLowPowerMode ? { opacity: 0 } : undefined}
                animate={isLowPowerMode ? { opacity: 1 } : undefined}
                exit={isLowPowerMode ? { opacity: 0 } : undefined}
                className="bg-black/90 border border-white/10 w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden relative z-[101] flex flex-col shadow-2xl"
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
                                <span className="text-white text-sm">Type <span className="font-bold text-white select-all">"{album.title}"</span> to confirm deletion.</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder={album.title}
                                    className="bg-black/50 border border-red-500/30 rounded px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleDelete}
                                    disabled={confirmText !== album.title}
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
                                        <motion.h2 className="text-3xl font-bold text-white">{album.title}</motion.h2>
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
                                        <span className="flex items-center gap-1"><ImageIcon size={14} /> {album.photos.length} Photos</span>
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

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {mounted && isOwner && !isSelectingCover && (
                            isUploading ? (
                                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 border-dashed border-white/20 flex flex-col items-center justify-center gap-2">
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
                                    className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group cursor-pointer"
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
                        {album.photos.map((photo, i) => (
                            <motion.div
                                key={photo.id}
                                layout
                                onClick={() => handlePhotoClick(photo)}
                                initial={isLowPowerMode ? { opacity: 1 } : { opacity: 0, y: 20 }}
                                animate={isLowPowerMode ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                transition={isLowPowerMode ? { duration: 0 } : { delay: i * 0.1 }}
                                className={clsx(
                                    "aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border relative group cursor-pointer",
                                    isSelectingCover ? "border-primary hover:opacity-80 hover:scale-[1.02] transition-all" : "border-white/5"
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
                                    <div className="w-full h-full relative group">
                                        <video
                                            src={photo.url}
                                            className="w-full h-full object-cover"
                                            controls={!isSelectingCover}
                                            loop
                                            muted
                                            playsInline
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={photo.url}
                                        className={clsx(
                                            "w-full h-full object-cover",
                                            !isLowPowerMode && !isSelectingCover && "transition-transform duration-500 group-hover:scale-110"
                                        )}
                                        loading="lazy"
                                    />
                                )}
                                <div className={clsx(
                                    "absolute inset-0 bg-black/0 transition-colors pointer-events-none",
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
