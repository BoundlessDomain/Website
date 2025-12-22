"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase";

interface AddReviewItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    articleId: string;
}


export default function AddReviewItemModal({ isOpen, onClose, onSuccess, articleId }: AddReviewItemModalProps) {
    const [name, setName] = useState("");
    const [rating, setRating] = useState<number>(5);

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
            let imageUrl = null;

            // 1. Upload Image (Attempt client upload)
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `item-${Date.now()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('article-images')
                    .upload(fileName, imageFile);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    // Proceed without image? Or throw?
                    // throw new Error("Image upload blocked.");
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('article-images')
                        .getPublicUrl(fileName);

                    imageUrl = publicUrl;
                }
            }

            // 2. Format Date
            const dateDisplay = `${day}-${month}-${year}`;

            // 3. Insert via API
            const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;

            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    article_id: articleId,
                    name,
                    rating,
                    content,
                    date_display: dateDisplay,
                    image_url: imageUrl,
                    email: ownerEmail
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create review item");
            }

            // 3. Reset
            setName("");
            setContent("");
            setImageFile(null);
            setImagePreview(null);
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error("Error creating review item:", error);
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
                            <h2 className="text-xl font-bold text-white">Add Review Item</h2>
                            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="e.g. Fiji Water"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-1">Rating (1-10)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={rating}
                                            onChange={(e) => setRating(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-1">Date (DD-MM-YYYY)</label>
                                        <div className="flex gap-2">
                                            {/* Day */}
                                            <select
                                                value={day}
                                                onChange={(e) => setDay(e.target.value)}
                                                className="w-1/3 px-2 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                            >
                                                {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                                                    <option key={d} value={d} className="bg-black">{d}</option>
                                                ))}
                                            </select>
                                            {/* Month */}
                                            <select
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                                className="w-1/3 px-2 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
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
                                                className="w-1/3 px-2 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors"
                                                min="2000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Review</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                                        placeholder="Review text..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Image</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-black/20 group"
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-white/40">
                                                <Upload size={24} className="mb-2" />
                                                <span className="text-sm">Upload Image</span>
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

                        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-white/70 hover:text-white transition-all">Cancel</button>
                            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 rounded-lg bg-primary text-black font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Add Item</>}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
