"use client";

import { User } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export default function AboutPage() {
    return (
        <PageTransition icon={User} title="ABOUT">
            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <p className="text-xl text-white/80">
                    More information about me and this website.
                </p>
            </div>
        </PageTransition>
    );
}
