import { AnimatePresence } from "framer-motion";
import AlbumModal from "@/components/photos/AlbumModal";
import { useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react"; // Assuming these are also needed based on usage
import PageTransition from "@/components/PageTransition"; // Assuming this is also needed based on usage
import HeroHighlights from "@/components/photos/HeroHighlights"; // Assuming this is also needed based on usage
import AlbumRow from "@/components/photos/AlbumRow"; // Assuming this is also needed based on usage

export default function GalleryPage() {
    const [data, setData] = useState<{ highlights: any[], albums: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
    const [initialPhotoId, setInitialPhotoId] = useState<string | undefined>(undefined);

    const fetchGallery = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/photos');
            const jsonData = await res.json();
            setData(jsonData);
            setLoading(false);

            // If an album is currently selected, update it with fresh data
            if (selectedAlbum) {
                const updatedAlbum = jsonData.albums.find((a: any) => a.id === selectedAlbum.id);
                if (updatedAlbum) {
                    setSelectedAlbum(updatedAlbum);
                } else {
                    // Album was deleted?
                    setSelectedAlbum(null);
                }
            }
        } catch (err) {
            console.error("Failed to load gallery", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

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
                    {/* Instant Refresh Button (Hidden/Optional or integrated? User asked for "refresh button for the gallery page". 
                        If they meant the browser button, we can't fix that. 
                        If they check the existing refresh logic in HeroHighlights or Navbar, that's different.
                        I'll assume they might want a manual refresh if things get stale, but auto-updates should handle it.
                        For now, the 'refresh' user asked about -> "when i click the refresh button for the gallery page" likely implies the browser one OR a custom one.
                        I'll stick to auto-updates.
                     */}

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
