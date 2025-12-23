"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Pencil } from "lucide-react";

interface ArticleCardProps {
    title: string;
    date: string;
    imageSrc?: string;
    children: ReactNode;
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
}


import { useUIStore } from "@/store/uiStore";

export default function ArticleCard({ title, date, imageSrc, children, onClick, onEdit }: ArticleCardProps) {
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    return (
        <motion.div
            whileHover={isLowPowerMode ? undefined : { scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            whileTap={isLowPowerMode ? undefined : { scale: 0.98 }}
            onClick={onClick}
            className="group relative flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md cursor-pointer transition-colors overflow-hidden"
        >
            {/* Edit Button (Top Right) */}
            {onEdit && (
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            onEdit(e);
                        }}
                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                        title="Edit Item"
                    >
                        <Pencil size={16} />
                    </button>
                </div>
            )}
            {/* Image Section */}
            <div className="md:w-1/3 flex-shrink-0 relative rounded-xl overflow-hidden bg-black/20">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={title}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full min-h-[200px] flex items-center justify-center text-white/20 px-4 text-center italic text-sm">
                        Sadly, no image is avaliable... yet
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-2 pr-8">
                    {/* pr-8 to avoid overlap with edit button if present */}
                    <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <span className="text-xs font-mono text-white/40 border border-white/10 px-2 py-1 rounded whitespace-nowrap ml-4">
                        {date}
                    </span>
                </div>

                {/* Body Text */}
                <div className="text-white/70 leading-relaxed text-sm md:text-base line-clamp-4 md:line-clamp-none">
                    {children}
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </motion.div>
    );
}
