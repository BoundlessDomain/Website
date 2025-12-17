"use client";

import { AnimatePresence } from "framer-motion";
import AlbumModal from "@/components/photos/AlbumModal";
import { useState, useCallback } from "react";
import { Camera } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import HeroHighlights from "@/components/photos/HeroHighlights";
import AlbumRow from "@/components/photos/AlbumRow";

interface GalleryData {
    highlights: any[];
    albums: any[];
}

interface GalleryClientProps {
    initialData: GalleryData;
}

export default function GalleryClient({ initialData }: GalleryClientProps) {
    const [data, setData] = useState<GalleryData>(initialData);
    const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
    const [initialPhotoId, setInitialPhotoId] = useState<string | undefined>(undefined);

    const refreshGallery = useCallback(async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/photos`);
            if (!res.ok) throw new Error("Network response was not ok");
            const jsonData = await res.json();

            setData(jsonData);

            // If an album is currently selected, update it with fresh data
            setSelectedAlbum((prev: any) => {
                if (!prev) return null;
                const updatedAlbum = jsonData.albums.find((a: any) => a.id === prev.id);
                return updatedAlbum || null;
            });

        } catch (err) {
            console.error("Failed to load gallery", err);
        }
    }, []);

    const handleSelectAlbum = (album: any) => {
        setInitialPhotoId(undefined);
        setSelectedAlbum(album);
    };

    const handleHighlightClick = (albumId: string, photoId: string) => {
        const album = data?.albums.find((a: any) => a.id === albumId);
        if (album) {
            setInitialPhotoId(photoId);
            setSelectedAlbum(album);
        }
    };

    return (
        <PageTransition icon={Camera} title="GALLERY">
             <div className="pb-20 w-full max-w-7xl mx-auto px-4 relative">
                <HeroHighlights
                    highlights={data.highlights || []}
                    onSelectHighlight={handleHighlightClick}
                    onRefresh={refreshGallery}
                />
                <AlbumRow
                    albums={data.albums || []}
                    onSelectAlbum={handleSelectAlbum}
                    onRefresh={refreshGallery}
                />

                <AnimatePresence>
                    {selectedAlbum && (
                        <AlbumModal
                            album={selectedAlbum}
                            onClose={() => setSelectedAlbum(null)}
                            initialPhotoId={initialPhotoId}
                            onAlbumUpdate={refreshGallery}
                        />
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
}
