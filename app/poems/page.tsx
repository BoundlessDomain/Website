"use client";

import { Feather } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export default function PoemsPage() {
    return (
        <PageTransition icon={Feather} title="POEMS">
            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <p className="text-xl text-white/80 font-serif italic text-center">
                    "Code is poetry written for machines to dream."
                </p>
                <p className="mt-8 text-white/60 text-center text-sm">More verses loading...</p>
            </div>
        </PageTransition>
    );
}
