"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ArticleCardProps {
    title: string;
    rating: number; // Out of 10
    date: string;
    imageSrc?: string;
    children: ReactNode;
    onClick?: () => void;
}

export default function ArticleCard({ title, rating, date, imageSrc, children, onClick }: ArticleCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-colors overflow-hidden"
        >
            {/* Image Section */}
            <div className="md:w-1/3 flex-shrink-0 relative aspect-video md:aspect-[4/3] rounded-xl overflow-hidden bg-black/20">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                        No Image
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <span className="text-xs font-mono text-white/40 border border-white/10 px-2 py-1 rounded">
                        {date}
                    </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-3 rounded-full mr-0.5 ${i < rating ? "bg-primary" : "bg-white/10"
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-sm font-bold text-primary">{rating}/10</span>
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
