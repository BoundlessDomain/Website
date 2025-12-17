"use client";

import { AnimatePresence } from "framer-motion";
import AlbumModal from "@/components/photos/AlbumModal";
import { useState, useEffect, useCallback } from "react";
import { Camera, Loader2 } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import HeroHighlights from "@/components/photos/HeroHighlights";
import AlbumRow from "@/components/photos/AlbumRow";

export default function GalleryPage() {
    const [data, setData] = useState<{ highlights: any[], albums: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
    const [initialPhotoId, setInitialPhotoId] = useState<string | undefined>(undefined);

    const fetchGallery = useCallback(async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/gallery`);
            if (!res.ok) throw new Error("Network response was not ok");
            const jsonData = await res.json();
            setData(jsonData);

            // If an album is currently selected, update it with fresh data
            if (selectedAlbum) {
                const updatedAlbum = jsonData.albums.find((a: any) => a.id === selectedAlbum.id);
                if (updatedAlbum) {
                    setSelectedAlbum(updatedAlbum);
                } else {
                    // Album was deleted
                    setSelectedAlbum(null);
                }
            }
        } catch (err) {
            console.error("Failed to load gallery", err);
            // Fallback to empty data so the UI still renders (and allows Owner to add albums)
            setData({ highlights: [], albums: [] });
        } finally {
            setLoading(false);
        }
    }, [selectedAlbum]);

    useEffect(() => {
        fetchGallery();
    }, []); // Run once on mount

    const handleSelectAlbum = (album: any) => {
        setInitialPhotoId(undefined); // Reset specific photo focus
        setSelectedAlbum(album);
    };

    const handleHighlightClick = (albumId: string, photoId: string) => {
        const album = data?.albums.find(a => a.id === albumId);
        if (album) {
            setInitialPhotoId(photoId);
            setSelectedAlbum(album);
        }
    };

    return (
        <PageTransition icon={Camera} title="GALLERY">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            ) : data ? (
                <div className="pb-20 w-full max-w-7xl mx-auto px-4 relative">
                    <HeroHighlights
                        highlights={data.highlights || []}
                        onSelectHighlight={handleHighlightClick}
                    />
                    <AlbumRow
                        albums={data.albums || []}
                        onSelectAlbum={handleSelectAlbum}
                    />

                    <AnimatePresence>
                        {selectedAlbum && (
                            <AlbumModal
                                album={selectedAlbum}
                                onClose={() => setSelectedAlbum(null)}
                                initialPhotoId={initialPhotoId}
                                onAlbumUpdate={fetchGallery}
                            />
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-white/50 text-center">Failed to load gallery.</div>
            )}
        </PageTransition>
    );
}
