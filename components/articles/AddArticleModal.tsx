"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase";

interface AddArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // For editing
}

export default function AddArticleModal({ isOpen, onClose, onSuccess, initialData }: AddArticleModalProps) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"standard" | "review_collection">("standard");
    const [rating, setRating] = useState<number | ''>(8); // Allow empty for typing

    // Date State
    const today = new Date();
    const [day, setDay] = useState(today.getDate().toString().padStart(2, '0'));
    const [month, setMonth] = useState((today.getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(today.getFullYear().toString());

    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-fill data if editing
    useState(() => {
        if (initialData) {
            setTitle(initialData.title);
            setType(initialData.type || "standard");
            setRating(initialData.rating || 8);
            setContent(initialData.content);
            setImagePreview(initialData.image_url);

            if (initialData.date_display) {
                const [d, m, y] = initialData.date_display.split('-');
                if (d && m && y) {
                    setDay(d);
                    setMonth(m);
                    setYear(y);
                }
            }
        } else {
            // Reset if no initial data (Adding new)
            setTitle("");
            setContent("");
            setImagePreview(null);
            setRating(8);
            setType("standard");
        }
    });

    // Reset when modal opens/closes or initialData changes
    // Actually better to use useEffect to sync initialData changes when isOpen
    import { useEffect } from "react";
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setType(initialData.type || "standard");
                setRating(initialData.rating || 8);
                setContent(initialData.content);
                setImagePreview(initialData.image_url);

                if (initialData.date_display) {
                    const [d, m, y] = initialData.date_display.split('-');
                    if (d && m && y) {
                        setDay(d);
                        setMonth(m);
                        setYear(y);
                    }
                }
            } else {
                // Reset defaults
                setTitle("");
                setContent("");
                setImageFile(null);
                setImagePreview(null);
                setRating(8);
                setType("standard");
                setDay(today.getDate().toString().padStart(2, '0'));
                setMonth((today.getMonth() + 1).toString().padStart(2, '0'));
                setYear(today.getFullYear().toString());
            }
        }
    }, [isOpen, initialData]);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get Session for Token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");
            const token = session.access_token;

            let imageUrl = initialData?.image_url || null; // Default to existing image key

            // 1. Upload Image (Server-side via API to bypass RLS)
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    throw new Error(err.error || "Image upload failed");
                }

                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }

            // 2. Format Date "DD-MM-YYYY"
            const dateDisplay = `${day}-${month}-${year}`;

            // 3. Create or Update Record via API
            const url = '/api/articles';
            const method = initialData ? 'PUT' : 'POST';

            const payload: any = {
                title,
                content,
                date_display: dateDisplay,
                image_url: imageUrl,
                type,
                rating: rating === '' ? 0 : Number(rating)
            };

            if (initialData) {
                payload.id = initialData.id;
            }

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Failed to ${initialData ? 'update' : 'create'} article`);
            }

            // 4. Success
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error("Error creating/updating article:", error);
            alert("Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                            <h2 className="text-xl font-bold text-white">{initialData ? "Edit Article" : "Add New Article"}</h2>
                            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Article Title"
                                    />
                                    {/* Type Selection */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-white/60 mb-1">Format</label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value as any)}
                                            className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                        >
                                            <option value="standard">Standard Article</option>
                                            <option value="review_collection">Review Collection (e.g. Water Rating)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Rating - Only for Standard */}
                                    {type === 'standard' && (
                                        <div>
                                            <label className="block text-sm font-medium text-white/60 mb-1">Rating (1-10)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="0.1"
                                                value={rating}
                                                onChange={(e) => setRating(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    )}
                                    {/* Date Selection (DD-MM-YYYY) */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-white/60 mb-1">Date (DD-MM-YYYY)</label>
                                        <div className="flex gap-2">
                                            {/* Day */}
                                            <select
                                                value={day}
                                                onChange={(e) => setDay(e.target.value)}
                                                className="flex-1 px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                            >
                                                {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                                                    <option key={d} value={d} className="bg-black">{d}</option>
                                                ))}
                                            </select>
                                            {/* Month */}
                                            <select
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                                className="flex-1 px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                                                    <option key={m} value={m} className="bg-black">{m}</option>
                                                ))}
                                            </select>
                                            {/* Year */}
                                            <input
                                                type="number"
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                className="flex-1 px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors"
                                                placeholder="YYYY"
                                                min="2000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Content</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                                        placeholder="Write your article here..."
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Cover Image</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-black/20 group"
                                    >
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-medium">Change Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-white/40">
                                                <Upload size={32} className="mb-2" />
                                                <span className="text-sm">Click to upload cover image</span>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2.5 rounded-lg bg-primary text-black font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        {initialData ? "Update Article" : "Publish Article"}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
