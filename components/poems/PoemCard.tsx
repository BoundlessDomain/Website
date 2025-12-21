"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import Image from "next/image";

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
}

export default function PoemCard({ poem, index }: PoemCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="break-inside-avoid mb-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 shadow-lg group"
        >
            {poem.image_url && (
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                        src={poem.image_url}
                        alt={poem.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
            )}

            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white font-serif tracking-wide">{poem.title}</h3>
                    <span className="text-xs text-white/40 font-mono pt-1">
                        {format(new Date(poem.date_written), "MMM dd, yyyy")}
                    </span>
                </div>

                <div className="text-white/70 font-serif leading-relaxed whitespace-pre-wrap text-sm">
                    {poem.body}
                </div>
            </div>
        </motion.div>
    );
}
