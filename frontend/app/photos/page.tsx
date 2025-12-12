"use client";

import { Camera } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export default function PhotosPage() {
    return (
        <PageTransition icon={Camera} title="PHOTOS">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="aspect-square bg-white/5 rounded-xl border border-white/10"></div>
                <div className="aspect-square bg-white/5 rounded-xl border border-white/10"></div>
                <div className="aspect-square bg-white/5 rounded-xl border border-white/10"></div>
                <div className="p-8 col-span-full text-center">
                    <p className="text-xl text-white/80">A visual gallery of moments and places.</p>
                </div>
            </div>
        </PageTransition>
    );
}
