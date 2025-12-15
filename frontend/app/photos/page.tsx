"use client";

import { Camera, Loader2 } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import HeroHighlights from "@/components/photos/HeroHighlights";
import AlbumRow from "@/components/photos/AlbumRow";
import { useState, useEffect } from "react";

export default function PhotosPage() {
    const [data, setData] = useState<{ highlights: any[], albums: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/api/photos')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load photos", err);
                setLoading(false);
            });
    }, []);

    return (
        <PageTransition icon={Camera} title="PHOTOS">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            ) : data ? (
                <div className="pb-20 w-full max-w-7xl mx-auto px-4">
                    <HeroHighlights highlights={data.highlights} />
                    <AlbumRow albums={data.albums} />
                </div>
            ) : (
                <div className="text-white/50 text-center">Failed to load photos.</div>
            )}
        </PageTransition>
    );
}
