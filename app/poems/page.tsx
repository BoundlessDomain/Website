"use client";

import { Feather, Plus, Loader2 } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import { useState, useEffect } from "react";
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

    useEffect(() => {
        fetchPoems();
    }, []);

    const handleCreate = () => {
        setEditingPoem(undefined);
        setModalOpen(true);
    };

    const handleEdit = (poem: any) => {
        setEditingPoem(poem);
        setModalOpen(true);
    };

    const handleToggleHidden = async (poem: any) => {
        try {
            const res = await fetch(`${getApiUrl()}/api/poems`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: poem.id, is_hidden: !poem.is_hidden })
            });
            if (!res.ok) throw new Error("Failed to toggle visibility");
            fetchPoems(); // Refresh list
        } catch (error) {
            console.error(error);
            alert("Error updating visibility");
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
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : poems.length === 0 ? (
                    <div className="text-center text-white/40 py-20">
                        No poems written yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Left Column (Even Indexes) */}
                        <div className="space-y-6">
                            {poems.filter((_, i) => i % 2 === 0).map((poem, idx) => (
                                <PoemCard
                                    key={poem.id}
                                    poem={poem}
                                    index={idx * 2}
                                    onEdit={isOwner ? handleEdit : undefined}
                                    onToggleHidden={isOwner ? handleToggleHidden : undefined}
                                />
                            ))}
                        </div>
                        {/* Right Column (Odd Indexes) */}
                        <div className="space-y-6">
                            {poems.filter((_, i) => i % 2 !== 0).map((poem, idx) => (
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
