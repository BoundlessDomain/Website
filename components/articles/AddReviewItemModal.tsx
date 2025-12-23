"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, Loader2, Save, Crop as CropIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from "@/utils/cropImage";

interface AddReviewItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    articleId: string;
    initialData?: any; // For editing
}

export default function AddReviewItemModal({ isOpen, onClose, onSuccess, articleId, initialData }: AddReviewItemModalProps) {
    const [name, setName] = useState("");
    const [rating, setRating] = useState<number | ''>(5);

    // Date State
    const today = new Date();
    const [day, setDay] = useState(today.getDate().toString().padStart(2, '0'));
    const [month, setMonth] = useState((today.getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(today.getFullYear().toString());

    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Cropper State
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-fill / Reset Data
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setRating(initialData.rating);
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
                // Reset
                setName("");
                setRating(5);
                setContent("");
                setImageFile(null);
                setImagePreview(null);
                setDay(today.getDate().toString().padStart(2, '0'));
                setMonth((today.getMonth() + 1).toString().padStart(2, '0'));
                setYear(today.getFullYear().toString());
            }
            // Reset Cropper
            setIsCropping(false);
            setCrop(undefined);
            setCompletedCrop(undefined);
        }
    }, [isOpen, initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        // Default to a centered crop if none exists
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                16 / 9,
                width,
                height
            ),
            width,
            height
        )
        setCrop(crop);
    }

    const showCroppedImage = async () => {
        if (imgRef.current && completedCrop) {
            try {
                // Calculate scale factors
                const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
                const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

                // Scale the crop coordinates to match the natural image size
                const scaledCrop = {
                    x: completedCrop.x * scaleX,
                    y: completedCrop.y * scaleY,
                    width: completedCrop.width * scaleX,
                    height: completedCrop.height * scaleY,
                };

                const croppedBlob = await getCroppedImg(imagePreview as string, scaledCrop);
                if (croppedBlob) {
                    const croppedFile = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });
                    setImageFile(croppedFile);
                    setImagePreview(URL.createObjectURL(croppedBlob));
                    setIsCropping(false);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = initialData?.image_url || null;
            // Get Session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");
            const token = session.access_token;

            // 1. Upload Image (Server-side via API)
            // If we have a new file (from upload OR crop), upload it
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

            // 2. Format Date
            const dateDisplay = `${day}-${month}-${year}`;

            // 3. Insert or Update via API
            const url = '/api/reviews';
            const method = initialData ? 'PUT' : 'POST';

            const payload: any = {
                article_id: articleId,
                name,
                rating: rating === '' ? 0 : Number(rating),
                content,
                date_display: dateDisplay,
                image_url: imageUrl
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
                const err = await res.json();
                throw new Error(err.error || `Failed to ${initialData ? 'update' : 'create'} review item`);
            }

            // 3. Reset
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error("Error creating/updating review item:", error);
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
                            <h2 className="text-xl font-bold text-white">{initialData ? "Edit Review Item" : "Add Review Item"}</h2>
                            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20">
                            {/* Cropping View */}
                            {isCropping && imagePreview ? (
                                <div className="space-y-4">
                                    <div className="relative w-full bg-black/50 rounded-xl overflow-hidden border border-white/10 flex justify-center">
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                            aspect={undefined} // Free crop
                                        >
                                            <img
                                                ref={imgRef}
                                                alt="Crop me"
                                                src={imagePreview}
                                                onLoad={onImageLoad}
                                                style={{ maxHeight: '60vh', objectFit: 'contain' }}
                                            />
                                        </ReactCrop>
                                    </div>
                                    <div className="flex justify-between items-center text-white/50 text-sm">
                                        <p>Drag corners to resize. Drag box to move.</p>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsCropping(false)}
                                            className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={showCroppedImage}
                                            className="px-4 py-2 rounded-lg bg-primary text-black font-bold hover:scale-105 transition-transform"
                                        >
                                            Apply Crop
                                        </button>
                                    </div>
                                </div>
                            ) : (
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
                                                min="0"
                                                max="10"
                                                step="0.1"
                                                value={rating}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setRating(val === '' ? '' : parseFloat(val));
                                                }}
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
                                        <div className="relative w-full rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors flex flex-col items-center justify-center overflow-hidden bg-black/20 group">
                                            {/* Changed container to NOT enforce aspect ratio, allows full height view */}
                                            {imagePreview ? (
                                                <div className="relative w-full">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-[400px] object-contain" />

                                                    {/* Controls Overlay */}
                                                    <div className="absolute top-2 right-2 flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCropping(true)}
                                                            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                                                            title="Crop Image"
                                                        >
                                                            <CropIcon size={20} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setImageFile(null);
                                                                setImagePreview(null);
                                                            }}
                                                            className="p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
                                                            title="Remove Image"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full py-12 flex flex-col items-center cursor-pointer text-white/40 hover:text-white/60 transition-colors"
                                                >
                                                    <Upload size={24} className="mb-2" />
                                                    <span className="text-sm">Upload Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </form>
                            )}
                        </div>

                        {!isCropping && (
                            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                                <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-white/70 hover:text-white transition-all">Cancel</button>
                                <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 rounded-lg bg-primary text-black font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {initialData ? "Update Item" : "Add Item"}</>}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
