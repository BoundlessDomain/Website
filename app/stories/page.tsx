"use client";

import { BookOpen } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export default function StoriesPage() {
    return (
        <PageTransition icon={BookOpen} title="STORIES">
            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h3 className="text-2xl font-bold text-white mb-4">Chapter 1: The Beginning</h3>
                <p className="text-xl text-white/80 leading-relaxed">
                    Short stories, narratives, and creative writing will live here.
                </p>
            </div>
        </PageTransition>
    );
}
