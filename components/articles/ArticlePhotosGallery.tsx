"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl } from "@/utils/api";

interface ArticlePhoto {
    id: string;
    image_url: string;
    created_at: string;
}

interface ArticlePhotosGalleryProps {
    articleId: string;
}

export default function ArticlePhotosGallery({ articleId }: ArticlePhotosGalleryProps) {
    const [photos, setPhotos] = useState<ArticlePhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Auth
    const isOwner = useUIStore((state) => state.isOwner);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/articles/${articleId}/photos`);
            if (res.ok) {
                const data = await res.json();
                setPhotos(data);
            }
        } catch (error) {
            console.error("Failed to fetch photos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [articleId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploading(true);

            // Get session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const formData = new FormData();
            // Append all files
            Array.from(files).forEach((file) => {
                formData.append('file', file);
            });

            const res = await fetch(`${getApiUrl()}/api/articles/${articleId}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Upload failed");
            }

            const result = await res.json();
            if (result.errors && result.errors.length > 0) {
                console.warn("Some files failed to upload:", result.errors);
                alert(`Uploaded ${result.uploaded.length} photos. ${result.errors.length} failed.`);
            }

            // Refresh photos
            await fetchPhotos();

        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload photos. Check console.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-end">
                <h3 className="text-xl font-bold text-white/80">
                    Some fun photos I got while writing for this article
                </h3>

                {isOwner && (
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-full transition-colors font-bold text-sm"
                        >
                            {uploading ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {uploading ? "Uploading..." : "Add Photo"}
                        </button>
                    </div>
                )}
            </div>

            {/* Gallery Container */}
            <div
                className="relative w-full overflow-x-auto pb-4"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <div className="flex gap-4">
                    {loading ? (
                        // Component Skeleton
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="w-64 h-48 bg-white/5 animate-pulse rounded-xl flex-shrink-0" />
                        ))
                    ) : photos.length > 0 ? (
                        photos.map((photo) => (
                            <motion.div
                                key={photo.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative w-64 h-48 flex-shrink-0 rounded-xl overflow-hidden group bg-black/20 border border-white/5"
                            >
                                <img
                                    src={photo.image_url}
                                    alt="Gallery"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <ImageIcon className="text-white/50 w-8 h-8" />
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="w-full py-8 text-center text-white/30 italic bg-white/5 rounded-xl border border-dashed border-white/10">
                            No photos added yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
