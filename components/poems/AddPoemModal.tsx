"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Calendar, Type, AlignLeft, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { getApiUrl } from "@/utils/api";

interface AddPoemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    poem?: any; // If provided, we are in EDIT mode
}

export default function AddPoemModal({ isOpen, onClose, onSuccess, poem }: AddPoemModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Populate form when poem prop changes (Edit Mode)
    useEffect(() => {
        if (isOpen && poem) {
            setTitle(poem.title);
            setBody(poem.body);
            setDate(poem.date_written);
            setPreviewUrl(poem.image_url); // Use existing image as preview
            setFile(null); // Reset file input
        } else if (isOpen && !poem) {
            // Reset for Create Mode
            setTitle("");
            setBody("");
            setDate(new Date().toISOString().split('T')[0]);
            setPreviewUrl(null);
            setFile(null);
        }
    }, [isOpen, poem]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = poem?.image_url || null; // Default to existing URL in edit mode

            // 1. Upload NEW Image if one was selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('poem-images')
                    .upload(filePath, file);

                if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('poem-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            // 2. Save/Update via API
            const method = poem ? 'PUT' : 'POST';
            const payload: any = {
                title,
                body,
                date_written: date,
                image_url: imageUrl
            };

            if (poem) {
                payload.id = poem.id; // Include ID for updates
            }

            const res = await fetch(`${getApiUrl()}/api/poems`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to save poem");
            }

            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error(error);
            alert(`Error saving poem: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
    const [deleteConfirmation, setDeleteConfirmation] = useState("");

    const handleDelete = async () => {
        if (deleteConfirmation !== poem.title) {
            alert("Title mismatch. Please type the exact title to confirm deletion.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/poems?id=${poem.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error("Failed to delete poem");
            onSuccess();
            handleClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (previewUrl && !previewUrl.startsWith('http')) {
            // Only revoke if it's a blob url we created, not if it's a remote URL
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setTitle("");
        setBody("");
        setDate(new Date().toISOString().split('T')[0]);
        setFile(null);
        setDeleteStep('idle');
        setDeleteConfirmation("");
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
                                    {deleteStep === 'confirm' ? (
                                        <span className="text-red-500">DELETE POEM?</span>
                                    ) : (
                                        <>
                                            {poem ? "EDIT" : "COMPOSE"} <span className="text-primary">POEM</span>
                                        </>
                                    )}
                                </h2>
                                <button onClick={handleClose} className="text-white/50 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {deleteStep === 'confirm' ? (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                            <p className="text-red-400 font-bold mb-2">WARNING: IRREVERSIBLE ACTION</p>
                                            <p className="text-white/60 text-sm">
                                                To confirm deletion, please type the exact title of the poem:
                                            </p>
                                            <p className="mt-2 text-white font-serif font-bold select-all">
                                                {poem.title}
                                            </p>
                                        </div>

                                        <input
                                            type="text"
                                            value={deleteConfirmation}
                                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center focus:outline-none focus:border-red-500 placeholder:text-white/20"
                                            placeholder="Type title here..."
                                        />

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setDeleteStep('idle')}
                                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                                            >
                                                CANCEL
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={loading || deleteConfirmation !== poem.title}
                                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONFIRM DELETE"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Image Upload */}
                                        <div className="relative group cursor-pointer border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-white/5 text-center min-h-[12rem] flex items-center justify-center hover:border-primary/50 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />

                                            {previewUrl ? (
                                                <>
                                                    <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[500px] object-contain" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-xs font-bold uppercase text-white tracking-wider">Change Image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-white/40 group-hover:text-primary transition-colors">
                                                    <Upload size={24} />
                                                    <span className="text-xs font-bold uppercase tracking-wider">
                                                        Upload Cover Image (Optional)
                                                    </span>
                                                </div>
                                            )}
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

                                        <div className="flex gap-4 pt-2">
                                            {poem && (
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => setDeleteStep('confirm')}
                                                    className="px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-xl transition-colors border border-red-500/20"
                                                >
                                                    DELETE
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 py-4 bg-primary text-black font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : (poem ? "UPDATE POEM" : "PUBLISH POEM")}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
