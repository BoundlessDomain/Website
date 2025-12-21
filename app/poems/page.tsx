"use client";

import { Feather, Plus, Loader2 } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import { useState, useEffect, useMemo } from "react";
import { useUIStore } from "@/store/uiStore";
import { getApiUrl } from "@/utils/api";
import PoemCard from "@/components/poems/PoemCard";
import AddPoemModal from "@/components/poems/AddPoemModal";
import { supabase } from "@/utils/supabase";

export default function PoemsPage() {
    const isOwner = useUIStore((state) => state.isOwner);
    const [poems, setPoems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPoem, setEditingPoem] = useState<any | undefined>(undefined);

    const fetchPoems = async () => {
        // Don't set loading to true if we already have data (prevents flashes on hidden toggle)
        if (poems.length === 0) setLoading(true);

        try {
            const headers: HeadersInit = {};
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const res = await fetch(`${getApiUrl()}/api/poems?t=${Date.now()}`, {
                headers: headers
            });
            if (res.ok) {
                const data = await res.json();
                setPoems(data);
            }
        } catch (error) {
            console.error("Failed to fetch poems", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when owner status changes (to get hidden poems on login)
    useEffect(() => {
        fetchPoems();
    }, [isOwner]);

    // 1. Filter: Instant hide on logout
    const visiblePoems = useMemo(() => {
        return poems.filter(p => !p.is_hidden || isOwner);
    }, [poems, isOwner]);

    // 2. Sort: Oldest to Newest
    const sortedPoems = useMemo(() => {
        return [...visiblePoems].sort((a, b) =>
            new Date(a.date_written).getTime() - new Date(b.date_written).getTime()
        );
    }, [visiblePoems]);

    // 3. Layout: Balanced Masonry (Greedy Partition)
    const { leftCol, rightCol } = useMemo(() => {
        const left: any[] = [];
        const right: any[] = [];
        let leftH = 0;
        let rightH = 0;

        sortedPoems.forEach((poem) => {
            // Heuristic Height Estimation:
            // Base card: ~150px
            // Text: ~0.5px per char (very rough avg for line wraps)
            // Image: ~300px (standard aspect ratio guess)
            const textH = (poem.body?.length || 0) * 0.5;
            const imgH = poem.image_url ? 300 : 0;
            const estimatedHeight = 150 + textH + imgH;

            if (leftH <= rightH) {
                left.push(poem);
                leftH += estimatedHeight;
            } else {
                right.push(poem);
                rightH += estimatedHeight;
            }
        });

        return { leftCol: left, rightCol: right };
    }, [sortedPoems]);

    const handleCreate = () => {
        setEditingPoem(undefined);
        setModalOpen(true);
    };

    const handleEdit = (poem: any) => {
        setEditingPoem(poem);
        setModalOpen(true);
    };

    // Optimistic Update for "Hide" toggle to feel instant
    const handleToggleHidden = async (poem: any) => {
        const newStatus = !poem.is_hidden;

        // Optimistic UI update
        setPoems(current => current.map(p =>
            p.id === poem.id ? { ...p, is_hidden: newStatus } : p
        ));

        try {
            const res = await fetch(`${getApiUrl()}/api/poems`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: poem.id, is_hidden: newStatus })
            });
            if (!res.ok) throw new Error("Failed to toggle visibility");
            // No need to fetchPoems() if optimistic update worked, but good for sync
            // fetchPoems(); 
        } catch (error) {
            console.error(error);
            alert("Error updating visibility");
            fetchPoems(); // Revert on error
        }
    };

    return (
        <PageTransition icon={Feather} title="POEMS">
            <div className="w-full max-w-5xl mx-auto px-4 pb-20 relative">

                {/* Owner Action */}
                {isOwner && (
                    <div className="mb-8 flex justify-end">
                        <button
                            onClick={handleCreate}
                            className="bg-primary hover:bg-white text-black font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all shadow-[0_0_20px_var(--primary-glow)]"
                        >
                            <Plus size={18} />
                            ADD POEM
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading && poems.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : sortedPoems.length === 0 ? (
                    <div className="text-center text-white/40 py-20">
                        No poems written yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {leftCol.map((poem, idx) => (
                                <PoemCard
                                    key={poem.id}
                                    poem={poem}
                                    index={idx * 2} // Approx index for anim
                                    onEdit={isOwner ? handleEdit : undefined}
                                    onToggleHidden={isOwner ? handleToggleHidden : undefined}
                                />
                            ))}
                        </div>
                        {/* Right Column */}
                        <div className="space-y-6">
                            {rightCol.map((poem, idx) => (
                                <PoemCard
                                    key={poem.id}
                                    poem={poem}
                                    index={(idx * 2) + 1}
                                    onEdit={isOwner ? handleEdit : undefined}
                                    onToggleHidden={isOwner ? handleToggleHidden : undefined}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal */}
                <AddPoemModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={fetchPoems}
                    poem={editingPoem}
                />
            </div>
        </PageTransition>
    );
}
