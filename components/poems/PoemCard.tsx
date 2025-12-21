"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Pencil, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useUIStore } from "@/store/uiStore";

interface Poem {
    id: string;
    title: string;
    body: string;
    date_written: string;
    image_url?: string | null;
    is_hidden?: boolean;
}

interface PoemCardProps {
    poem: Poem;
    index: number;
    onEdit?: (poem: Poem) => void;
    onToggleHidden?: (poem: Poem) => void;
}

export default function PoemCard({ poem, index, onEdit, onToggleHidden }: PoemCardProps) {
    const isOwner = useUIStore((state) => state.isOwner);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        try {
            const [year, month, day] = dateString.split("-");
            // Note: month is 0-indexed in JS Date
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            if (day === "00") {
                // Return only Month Year
                return format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMM yyyy");
            }
            return format(dateObj, "MMM dd, yyyy");
        } catch (e) {
            return dateString;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`break-inside-avoid mb-6 bg-black/40 backdrop-blur-md border rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 shadow-lg group relative ${poem.is_hidden ? 'border-red-500/30 bg-red-900/10' : 'border-white/10'
                }`}
        >
            {/* Owner Actions */}
            {isOwner && (
                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onToggleHidden && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleHidden(poem);
                            }}
                            className="bg-black/80 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm hover:scale-110 transition-all shadow-lg border border-white/10"
                            title={poem.is_hidden ? "Show to Public" : "Hide from Public"}
                        >
                            {poem.is_hidden ? <EyeOff size={16} className="text-red-400" /> : <Eye size={16} />}
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(poem);
                            }}
                            className="bg-black/80 hover:bg-black text-red-500 p-2 rounded-full backdrop-blur-sm hover:scale-110 transition-all shadow-lg border border-white/10"
                            title="Edit Poem"
                        >
                            <Pencil size={16} />
                        </button>
                    )}
                </div>
            )}

            {poem.image_url && (
                <div className="relative w-full">
                    {/* Width 100%, Height Auto to show full image */}
                    <img
                        src={poem.image_url}
                        alt={poem.title}
                        className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                    />
                </div>
            )}

            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white font-serif tracking-wide">{poem.title}</h3>
                    <span className="text-xs text-white/40 font-mono pt-1">
                        {formatDate(poem.date_written)}
                    </span>
                </div>

                <div className="text-white/70 font-serif leading-relaxed whitespace-pre-wrap text-sm">
                    {poem.body}
                </div>
            </div>
        </motion.div>
    );
}
