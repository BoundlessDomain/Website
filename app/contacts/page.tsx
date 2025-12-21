"use client";

import { Users } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { useRouter } from "next/navigation";

export default function ContactsPage() {
    const isLoggedIn = useUIStore((state) => state.isLoggedIn);
    const router = useRouter();

    useEffect(() => {
        // Immediate redirect if not logged in
        if (!isLoggedIn) {
            router.push("/");
        }
    }, [isLoggedIn, router]);

    // PREVENT RENDER if not logged in (to avoid flash)
    if (!isLoggedIn) return null;

    return (
        <PageTransition icon={Users} title="CONTACTS">
            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="space-y-4 text-white/80">
                    <p className="text-xl font-bold text-white">Contact List</p>
                    <p>
                        This feature is currently under development.
                        <br />
                        Soon you will be able to manage your contacts here!
                    </p>
                    <div className="flex gap-4 mt-8 opacity-50">
                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/3 bg-white/10 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
