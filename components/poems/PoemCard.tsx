"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import Image from "next/image";
import { useUIStore } from "@/store/uiStore";

interface Poem {
    id: string;
    title: string;
    body: string;
    date_written: string;
    image_url?: string | null;
}

interface PoemCardProps {
    poem: Poem;
    index: number;
    onEdit?: (poem: Poem) => void;
}

export default function PoemCard({ poem, index, onEdit }: PoemCardProps) {
    const isOwner = useUIStore((state) => state.isOwner);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        try {
            const [year, month, day] = dateString.split("-");
            // Note: month is 0-indexed in JS Date, but we construct manually or use date-fns if standard
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
            className="break-inside-avoid mb-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 shadow-lg group relative"
        >
            {/* Edit Button (Visible to owner on hover) */}
            {isOwner && onEdit && (
                <button
                    onClick={() => onEdit(poem)}
                    className="absolute top-4 right-4 z-20 bg-black/80 hover:bg-black text-red-500 p-2 rounded-full transition-all duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:scale-110"
                    title="Edit Poem"
                >
                    <Pencil size={18} />
                </button>
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
