"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Calendar, Type, AlignLeft, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { getApiUrl } from "@/utils/api";
import clsx from "clsx";

interface AddPoemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddPoemModal({ isOpen, onClose, onSuccess }: AddPoemModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = null;

            // 1. Upload Image if exists
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('poem-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('poem-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            // 2. Save Poem Data via API
            const res = await fetch(`${getApiUrl()}/api/poems`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    body,
                    date_written: date,
                    image_url: imageUrl
                })
            });

            if (!res.ok) throw new Error("Failed to save poem");

            onSuccess();
            handleClose();
        } catch (error) {
            console.error(error);
            alert("Error creating poem");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle("");
        setBody("");
        setDate(new Date().toISOString().split('T')[0]);
        setFile(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={handleClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h2 className="text-lg font-bold text-white tracking-widest flex items-center gap-2">
                                    COMPOSE <span className="text-primary">POEM</span>
                                </h2>
                                <button onClick={handleClose} className="text-white/50 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Image Upload */}
                                    <div className="relative group cursor-pointer border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-primary/50 transition-colors bg-white/5 text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center gap-2 text-white/40 group-hover:text-primary transition-colors">
                                            <Upload size={24} />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {file ? file.name : "Upload Cover Image (Optional)"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase text-primary font-bold ml-1">Title</label>
                                        <div className="relative">
                                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary placeholder:text-white/20"
                                                placeholder="Enter title..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase text-primary font-bold ml-1">Date Written</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary placeholder:text-white/20 color-scheme-dark"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase text-primary font-bold ml-1">Poem Body</label>
                                        <div className="relative">
                                            <AlignLeft className="absolute left-3 top-4 text-white/30" size={16} />
                                            <textarea
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary placeholder:text-white/20 min-h-[200px] resize-none font-serif leading-relaxed"
                                                placeholder="Write your verses here..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : "PUBLISH POEM"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
