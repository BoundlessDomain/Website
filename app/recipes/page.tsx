"use client";

import { Utensils } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export default function RecipesPage() {
    return (
        <PageTransition icon={Utensils} title="RECIPES">
            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <p className="text-xl text-white/80">
                    Culinary experiments and favorite dishes.
                </p>
            </div>
        </PageTransition>
    );
}
