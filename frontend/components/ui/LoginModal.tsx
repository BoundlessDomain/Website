"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, User, Mail, ArrowLeft, Chrome, Linkedin } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { supabase } from "@/utils/supabase";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthView = 'login' | 'signup' | 'recovery';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Reset view on close
    const handleClose = () => {
        onClose();
        setTimeout(() => setView('login'), 300);
        setError(null);
        setEmail("");
        setPassword("");
        setUsername("");
        setFullName("");
    };

    const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
        setIsLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.href}`,
            }
        });
        if (error) setError(error.message);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                handleClose();
            }
            else if (view === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username,
                            full_name: fullName,
                        }
                    }
                });
                if (error) throw error;
                handleClose();
                alert("Check your email for confirmation!");
            }
            else if (view === 'recovery') {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                alert("Recovery link sent!");
                setView('login');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-md p-8 rounded-2xl bg-black/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] pointer-events-auto relative overflow-hidden flex flex-col min-h-[500px]">
                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

                            {/* Header */}
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    {view !== 'login' && (
                                        <button onClick={() => setView('login')} className="text-white/50 hover:text-cyan-400 transition-colors">
                                            <ArrowLeft size={20} />
                                        </button>
                                    )}
                                    <h2 className="text-2xl font-bold text-white tracking-widest">
                                        {view === 'login' && <>SYSTEM <span className="text-cyan-400">ACCESS</span></>}
                                        {view === 'signup' && <>NEW <span className="text-cyan-400">IDENTITY</span></>}
                                        {view === 'recovery' && <>RECOVER <span className="text-cyan-400">KEY</span></>}
                                    </h2>
                                </div>
                                <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 text-center text-xs text-red-500 font-bold bg-red-500/10 py-2 rounded">
                                    {error.toUpperCase()}
                                </div>
                            )}

                            {/* Form Content */}
                            <motion.form
                                key={view}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-6 flex-grow"
                            >
                                {/* Name & Username Fields (Signup Only) */}
                                {view === 'signup' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-cyan-400 font-bold ml-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all placeholder:text-white/20"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-cyan-400 font-bold ml-1">Username</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all placeholder:text-white/20"
                                                    placeholder="CyberPunk99"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Email/User Field (All Views) */}
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-cyan-400 font-bold ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all placeholder:text-white/20"
                                            placeholder={view === 'recovery' ? "Enter recovery email..." : "user@example.com"}
                                        />
                                    </div>
                                </div>

                                {/* Password Field (Login/Signup Only) */}
                                {view !== 'recovery' && (
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-cyan-400 font-bold ml-1">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" size={20} />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all placeholder:text-white/20"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Main Action Button */}
                                <button
                                    disabled={isLoading}
                                    className="mt-2 w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold tracking-widest rounded-xl 
                                             shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]
                                             hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    <span className="relative z-10">
                                        {isLoading ? "PROCESSING..." : (
                                            view === 'login' ? "CONNECT" :
                                                view === 'signup' ? "INITIALIZE" : "SEND RECOVERY LINK"
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                </button>
                            </motion.form>

                            {/* Social Auth Section (Login/Signup Only) */}
                            {view !== 'recovery' && (
                                <div className="mt-8 space-y-4">
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute w-full h-[1px] bg-white/10" />
                                        <span className="relative bg-black/80 px-4 text-xs text-white/40 uppercase tracking-widest">
                                            Or connect with
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin('google')}
                                            className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                        >
                                            <Chrome className="text-white/60 group-hover:text-cyan-400 transition-colors" size={18} />
                                            <span className="text-sm font-bold text-white/80">Google</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin('linkedin')}
                                            className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                        >
                                            <Linkedin className="text-white/60 group-hover:text-cyan-400 transition-colors" size={18} />
                                            <span className="text-sm font-bold text-white/80">LinkedIn</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Footer Links (Login View Only) */}
                            {view === 'login' && (
                                <div className="mt-8 flex justify-between text-xs">
                                    <button onClick={() => setView('signup')} className="text-white/40 hover:text-cyan-400 transition-colors uppercase tracking-wider">
                                        Initialize Access
                                    </button>
                                    <button onClick={() => setView('recovery')} className="text-white/40 hover:text-cyan-400 transition-colors uppercase tracking-wider">
                                        Recover Key
                                    </button>
                                </div>
                            )}

                            {/* Back to Login Link (Signup Only) */}
                            {view === 'signup' && (
                                <div className="mt-8 text-center text-xs">
                                    <span className="text-white/40">Already have an ID? </span>
                                    <button onClick={() => setView('login')} className="text-cyan-400 hover:text-cyan-300 font-bold ml-1">
                                        SYSTEM LOGIN
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
