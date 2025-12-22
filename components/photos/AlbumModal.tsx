"use client";

import { motion, AnimatePresence, useIsPresent } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Calendar, Image as ImageIcon, Edit2, Plus, UploadCloud, Trash2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import clsx from "clsx";
import { supabase } from "@/utils/supabase";
import { getApiUrl } from "@/utils/api";

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
    album: Album;
    onClose: () => void;
    initialPhotoId?: string;
    onAlbumUpdate?: () => void;
}


const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1999 }, (_, i) => (currentYear - i).toString());

export default function AlbumModal({ album, onClose, initialPhotoId, onAlbumUpdate }: AlbumModalProps) {
    const isPresent = useIsPresent();
    const isOwner = useUIStore((state) => state.isOwner);
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode); // Moved Up
    const [mounted, setMounted] = useState(false);

    // Local state to manage the album data without reloading
    const [currentAlbum, setCurrentAlbum] = useState<Album | null>(album);

    // Local state for inline editing
    const [title, setTitle] = useState(album?.title || "");

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

    // Sync state when album opens/updates
    useEffect(() => {
        if (album) {
            if (!currentAlbum || currentAlbum.id !== album.id || currentAlbum.date !== album.date) {
                // Determine initial date format
                // If it looks like "Month Year", convert to YYYY-MM-01 for the input
                let dateStr = album.date || new Date().toISOString().split('T')[0];
                if (!dateStr.includes('-')) {
                    // Legacy format likely "January 2024"
                    // Try to parse
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toISOString().split('T')[0];
                    } else {
                        // Fallback
                        dateStr = new Date().toISOString().split('T')[0];
                    }
                }

                setCurrentAlbum({ ...album, date: dateStr });
                setTitle(album.title);

                // PRELOAD IMAGES
                album.photos.forEach(photo => {
                    if (photo.type !== "video") {
                        const img = new Image();
                        img.src = `${getApiUrl()}/api/proxy?url=${encodeURIComponent(photo.url)}`;
                    }
                });
            }
        }
    }, [album]); // Remove currentAlbum dependency to avoid loops, just react to prop prop changes

    // Scroll to initial photo
    useEffect(() => {
        if (initialPhotoId && mounted && currentAlbum) {
            // Retry mechanism to ensure element is found
            let attempts = 0;
            const maxAttempts = 10;

            const attemptScroll = () => {
                const element = document.getElementById(`photo-${initialPhotoId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    // Add a temporary highlight
                    element.classList.add('ring-4', 'ring-primary');
                    // Longer duration (3s) so user sees it
                    setTimeout(() => element.classList.remove('ring-4', 'ring-primary'), 3000);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(attemptScroll, 200); // Retry every 200ms
                }
            };

            // Start attempting after a short delay to allow layout to settle
            setTimeout(attemptScroll, 300);
        }
    }, [initialPhotoId, mounted, currentAlbum]); // Added currentAlbum dependency/check

    if (!currentAlbum) return null;

    const saveChanges = async (newTitle: string, newCover: string, newDate: string) => {
        // Optimistic Update
        setCurrentAlbum(prev => prev ? ({ ...prev, title: newTitle, coverUrl: newCover, date: newDate }) : null);

        try {
            await fetch(`${getApiUrl()}/api/gallery/albums/${currentAlbum.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, coverUrl: newCover, date: newDate })
            });
            onAlbumUpdate?.();
        } catch (e) {
            console.error("Failed to save changes", e);
        }
    };

    const handleUpdate = () => {
        // Wrapper for onBlur using current state
        saveChanges(title, currentAlbum.coverUrl, currentAlbum.date);
    };

    const handleEditCover = async () => {
        setIsSelectingCover(!isSelectingCover);
    };

    const handlePhotoClick = async (photo: Photo) => {
        if (isSelectingCover) {
            setIsSelectingCover(false);
            saveChanges(title, photo.url, currentAlbum.date);
        } else {
            // Future lightbox logic
        }
    };

    const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening/selecting
        if (!confirm("Are you sure you want to delete this photo?")) return;

        // Find photo URL to delete from Supabase
        const photoToDelete = currentAlbum.photos.find(p => p.id === photoId);

        // Optimistic Update: Remove instantaneously
        setCurrentAlbum(prev => prev ? ({
            ...prev,
            photos: prev.photos.filter(p => p.id !== photoId)
        }) : null);

        try {
            // 1. Delete from Supabase Storage
            if (photoToDelete) {
                try {
                    const urlObj = new URL(photoToDelete.url);
                    const pathParts = urlObj.pathname.split('/gallery/');
                    if (pathParts.length > 1) {
                        const storagePath = decodeURIComponent(pathParts[1]);
                        const { error } = await supabase.storage.from('gallery').remove([storagePath]);
                        if (error) console.error("Supabase delete error:", error);
                    }
                } catch (err) {
                    console.warn("Failed to parse/delete Supabase file", err);
                }
            }

            // 2. Delete from Backend (and Cache)
            await fetch(`${getApiUrl()}/api/gallery/albums/${currentAlbum.id}/photos/${photoId}`, {
                method: 'DELETE',
            });
            onAlbumUpdate?.(); // Notify parent to refresh data
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (confirmText !== currentAlbum.title) return;

        try {
            await fetch(`${getApiUrl()}/api/gallery/albums/${currentAlbum.id}`, {
                method: 'DELETE',
            });
            onClose();
            onAlbumUpdate?.(); // Notify parent, don't force reload
        } catch (e) { console.error(e); }
    };

    // File Upload Logic
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) { resolve(file); return; }

                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1920;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) { resolve(file); return; }
                    const compressedFile = new File([blob], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                }, "image/jpeg", 0.8);
            };
            img.onerror = () => resolve(file);
        });
    };

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

                // OPTIMIZATION: Compress images before upload
                let fileToUpload = file;
                if (fileType === 'image') {
                    try {
                        // console.log(`[File ${i}] Compressing...`);
                        fileToUpload = await compressImage(file);
                        // console.log(`[File ${i}] Compressed...`);
                    } catch (e) {
                        console.warn("Compression failed, using original", e);
                    }
                }

                const folderName = currentAlbum.title.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
                const uniqueId = Math.random().toString(36).substring(7);
                const fileName = `${folderName}/${Date.now()}_${uniqueId}.${fileExt}`;

                // 1. Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from('gallery')
                    .upload(fileName, fileToUpload);

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('gallery')
                    .getPublicUrl(fileName);

                // 3. Save to Backend
                const res = await fetch(`${getApiUrl()}/api/gallery/albums/${currentAlbum.id}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: publicUrl, type: fileType })
                });

                if (!res.ok) throw new Error(await res.text());

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
            onAlbumUpdate?.(); // Refresh parent

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




    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
        >
            <div
                className={clsx(
                    "absolute inset-0 bg-black/80",
                    !isLowPowerMode && "backdrop-blur-md",
                    isPresent ? "pointer-events-auto" : "pointer-events-none"
                )}
                onClick={onClose}
            />

            <motion.div
                layoutId={!isLowPowerMode ? `album-card-${currentAlbum.id}` : undefined}
                className={clsx(
                    "bg-black/90 border border-white/10 w-full max-w-[95vw] h-[90vh] rounded-3xl overflow-hidden relative z-[101] flex flex-col shadow-2xl",
                    isPresent ? "pointer-events-auto" : "pointer-events-none"
                )}
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
                                <span className="text-white text-sm">Type <span className="font-bold text-white select-all">&quot;{currentAlbum.title}&quot;</span> to confirm deletion.</span>
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
                                        <span className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {mounted && isOwner ? (
                                                <div className="flex bg-black rounded items-center">
                                                    {/* Month */}
                                                    <select
                                                        value={currentAlbum.date.split('-')[1] || "01"}
                                                        onChange={(e) => {
                                                            const [y, _, __] = (currentAlbum.date || new Date().toISOString().split('T')[0]).split('-');
                                                            // Always default to 01 for day to avoid invalid dates (e.g. Feb 31) and simplify
                                                            const newDate = `${y}-${e.target.value}-01`;
                                                            saveChanges(title, currentAlbum.coverUrl, newDate);
                                                        }}
                                                        className="bg-transparent text-white text-sm px-1 py-0.5 outline-none appearance-none cursor-pointer hover:text-primary transition-colors text-center w-[120px]"
                                                    >
                                                        {Array.from({ length: 12 }, (_, i) => {
                                                            const m = (i + 1).toString().padStart(2, '0');
                                                            const label = new Date(2000, i, 1).toLocaleString('default', { month: 'long' });
                                                            return <option key={m} value={m} className="bg-black">{label}</option>;
                                                        })}
                                                    </select>
                                                    <span className="text-white/30 text-xs mx-0.5">/</span>

                                                    {/* Year */}
                                                    <input
                                                        type="number"
                                                        value={currentAlbum.date.split('-')[0] || new Date().getFullYear().toString()}
                                                        onChange={(e) => {
                                                            const [_, m, __] = (currentAlbum.date || new Date().toISOString().split('T')[0]).split('-');
                                                            const newDate = `${e.target.value}-${m}-01`;
                                                            saveChanges(title, currentAlbum.coverUrl, newDate);
                                                        }}
                                                        className="bg-transparent text-white text-sm px-1 py-0.5 outline-none w-14 hover:text-primary transition-colors text-left"
                                                        placeholder="YYYY"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-base text-primary">
                                                    {new Date(currentAlbum.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </span>
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

                {/* Masonry Grid with 4 Columns and Variable Height */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth" id="album-scroll-container">
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-20">
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
                                            {uploadProgress.current}/{uploadProgress.total}
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
                                id={`photo-${photo.id}`}
                                layout
                                onClick={() => handlePhotoClick(photo)}
                                initial={isLowPowerMode ? { opacity: 1 } : { opacity: 0, y: 20 }}
                                animate={isLowPowerMode ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                transition={isLowPowerMode ? { duration: 0 } : { duration: 0.5, delay: i * 0.01 }} // Fast stagger to avoid "column load" look
                                className={clsx(
                                    "break-inside-avoid mb-4 block w-full rounded-xl overflow-hidden relative group cursor-pointer bg-white/5",
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
                                        className="absolute top-2 right-2 z-30 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Photo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                {photo.type === "video" ? (
                                    <video
                                        src={`${getApiUrl()}/api/proxy?url=${encodeURIComponent(photo.url)}`}
                                        className="w-full h-auto object-contain block" // Natural height
                                        controls={false}
                                        onMouseOver={event => (event.target as HTMLVideoElement).play()}
                                        onMouseOut={event => (event.target as HTMLVideoElement).pause()}
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={`${getApiUrl()}/api/proxy?url=${encodeURIComponent(photo.url)}`}
                                        className="w-full h-auto object-contain block transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
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
        </motion.div >
    );
}
