"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, HelpCircle } from "lucide-react";
import clsx from "clsx";

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [contact, setContact] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch('http://localhost:8000/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, contact })
            });
            if (res.ok) {
                setShowSuccess(true);
                setMessage("");
                setContact("");
                setTimeout(() => {
                    setShowSuccess(false);
                    setIsOpen(false);
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to send feedback", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* Floating Button (Bottom Right) */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-0 right-0 z-[60] group pointer-events-auto"
                initial={{ x: 20, y: 20 }}
                animate={{ x: 0, y: 0 }}
                whileHover={{ scale: 1.1 }}
            >
                {/* Quarter Circle Shape */}
                <div className="relative w-20 h-20 bg-primary/20 backdrop-blur-md rounded-tl-[100%] border-t border-l border-primary/50 shadow-[0_0_20px_var(--primary-glow)] overflow-hidden transition-colors duration-300 group-hover:bg-primary/40">
                    <div className="absolute bottom-4 right-4 text-primary group-hover:text-white transition-colors">
                        <HelpCircle size={32} />
                    </div>
                </div>
            </motion.button>

            {/* Feedback Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
                        {/* Overlay Click to Close */}
                        <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-black/90 border border-primary/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_40px_var(--primary-glow)] relative z-[101]"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <MessageSquare className="text-primary" size={20} />
                                Feedback
                            </h3>
                            <p className="text-xs text-white/50 mb-4">
                                Found a bug? Have a suggestion? Let us know!
                            </p>

                            {showSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-8 gap-3 text-green-400"
                                >
                                    <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center">
                                        <Send size={24} />
                                    </div>
                                    <span className="font-bold">Sent! Thank you.</span>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-white/70 ml-1 mb-1 block">Message</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="What's on your mind?"
                                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-primary/50 resize-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-white/70 ml-1 mb-1 block">Contact (Optional)</label>
                                        <input
                                            type="text"
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            placeholder="Email or Name"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-primary/50"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className={clsx(
                                            "mt-2 w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                                            isSending
                                                ? "bg-white/10 text-white/50 cursor-not-allowed"
                                                : "bg-primary text-black hover:bg-white hover:shadow-[0_0_20px_var(--primary-glow)]"
                                        )}
                                    >
                                        {isSending ? "Sending..." : "Submit Feedback"}
                                        {!isSending && <Send size={16} />}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
