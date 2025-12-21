"use client";

import { Feather, Plus, Loader2 } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import { useState, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { getApiUrl } from "@/utils/api";
import PoemCard from "@/components/poems/PoemCard";
import AddPoemModal from "@/components/poems/AddPoemModal";

export default function PoemsPage() {
    const isOwner = useUIStore((state) => state.isOwner);
    const [poems, setPoems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPoem, setEditingPoem] = useState<any | undefined>(undefined);

    const fetchPoems = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/poems?t=${Date.now()}`);
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
                    <div className="columns-1 md:columns-2 gap-6 space-y-6">
                        {poems.map((poem, idx) => (
                            <PoemCard
                                key={poem.id}
                                poem={poem}
                                index={idx}
                                onEdit={isOwner ? handleEdit : undefined}
                            />
                        ))}
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
