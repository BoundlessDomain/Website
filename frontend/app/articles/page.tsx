"use client";

import { FileText } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export default function ArticlesPage() {
    return (
        <PageTransition icon={FileText} title="ARTICLES">
            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <p className="text-xl text-white/80">
                    Coming soon. A collection of thoughts and technical deep dives.
                </p>
                <div className="mt-8 h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                <div className="mt-4 h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
            </div>
        </PageTransition>
    );
}
