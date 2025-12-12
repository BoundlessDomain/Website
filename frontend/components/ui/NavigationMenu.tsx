"use client";

import { LucideIcon, Home, User, Briefcase, FileText, Mail, Wrench, LogOut } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import LoginModal from "./LoginModal";
import SettingsMenu from "./SettingsMenu";
import { supabase } from "@/utils/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { isAdmin } from "@/utils/roles";

interface NavItem {
    label: string;
    icon: LucideIcon;
    href: string;
}

const leftItems: NavItem[] = [
    { label: "HOME", icon: Home, href: "/" },
    { label: "SERVICES", icon: Wrench, href: "/services" },
    { label: "ABOUT", icon: User, href: "/about" },
];

const rightItemsFixed: NavItem[] = [
    { label: "PORTFOLIO", icon: Briefcase, href: "/portfolio" },
    { label: "BLOG", icon: FileText, href: "/blog" },
    { label: "CONTACT", icon: Mail, href: "/contact" },
];

function getNameFromEmail(email?: string) {
    if (!email) return "User";
    return email.split('@')[0];
}

function NavButton({ item, side }: { item: NavItem, side: 'left' | 'right' }) {
    return (
        <a href={item.href} className={clsx(
            "group relative flex items-center justify-between gap-4 p-2 w-72 transition-all duration-300 hover:scale-105",
            side === 'left' ? "flex-row-reverse text-right" : "flex-row text-left"
        )}>
            {/* Text Label */}
            <span className={clsx(
                "text-cyan-400 font-bold tracking-widest transition-opacity duration-300 whitespace-nowrap",
                "text-lg shadow-cyan-500/50 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"
            )}>
                {item.label}
            </span>

            {/* Circle Button */}
            <div className="relative w-16 h-16 rounded-full border-2 border-cyan-500 bg-gray-900/80 flex items-center justify-center
                          shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.8)]
                          group-hover:border-white transition-all duration-300">
                <item.icon className="w-8 h-8 text-cyan-400 group-hover:text-white transition-colors" />
            </div>

            {/* Connecting Line (Decorative) - Moved to be "under" text */}
            <div className={clsx(
                "absolute bottom-0 w-12 h-[2px] bg-cyan-900 -z-10 group-hover:bg-cyan-500 transition-colors",
                side === 'left' ? "right-10 translate-x-full" : "left-10 -translate-x-full"
            )} />
        </a>
    );
}

export default function NavigationMenu() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);

    useEffect(() => {
        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex justify-between items-center px-20">
            {/* Login Modal */}
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            {/* Home Button - Top Left (Replaces Logo) */}
            <div className="absolute top-8 left-8 pointer-events-auto">
                <a href="/" className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-cyan-500/30 bg-black/40 backdrop-blur-md
                                     hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 group">
                    <Home className="w-8 h-8 text-cyan-400 group-hover:text-white transition-colors" />
                </a>
            </div>

            {/* Login/Profile - Top Right */}
            <div className="absolute top-8 right-8 pointer-events-auto">
                {user ? (
                    <div className="flex items-center gap-4">
                        {/* Greeting */}
                        <div className="flex flex-col items-end mr-2 hidden md:flex">
                            <span className="text-cyan-400 font-bold tracking-wider text-sm shadow-cyan-500/50 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                                Hello, {user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.username || getNameFromEmail(user.email)}
                            </span>
                            {isAdmin(user.email) && (
                                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/50 px-2 py-0.5 rounded-full font-bold tracking-widest mt-1 shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                                    OWNER ACCESS
                                </span>
                            )}
                        </div>

                        {/* Settings Menu */}
                        <SettingsMenu />

                        {/* Profile Circle */}
                        <div className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-black/40 backdrop-blur-md overflow-hidden relative shadow-[0_0_15px_rgba(6,182,212,0.5)] group">
                            {user.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-cyan-900/50">
                                    <span className="text-cyan-200 font-bold text-xl uppercase">
                                        {user.user_metadata?.username?.[0] || user.email?.[0] || "U"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Logout Mini Button */}
                        <button
                            onClick={handleLogout}
                            className="p-3 rounded-full bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                            title="Disconnect System"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsLoginOpen(true)}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold tracking-wider rounded-full 
                                       shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)]
                                       hover:scale-110 transition-all duration-300 border border-cyan-400/30">
                        LOGIN
                    </button>
                )}
            </div>

            {/* Left Menu Items - Individual Floating Windows */}
            <div className="flex flex-col gap-6 items-end">
                {leftItems.map((item, i) => (
                    <motion.div
                        key={i}
                        className={clsx(
                            "p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto",
                            i === 1 ? "mr-12" : "" // Push middle button outward (Left)
                        )}
                        animate={{
                            y: [0, -10, 0],
                            x: [0, 5, 0]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 5 + i, // Different duration for each
                            ease: "easeInOut",
                            delay: i * 0.5 // Staggered start
                        }}
                    >
                        <NavButton item={item} side="left" />
                    </motion.div>
                ))}
            </div>

            {/* Right Menu Items - Individual Floating Windows */}
            <div className="flex flex-col gap-6 items-start">
                {rightItemsFixed.map((item, i) => (
                    <motion.div
                        key={i}
                        className={clsx(
                            "p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto",
                            i === 1 ? "ml-12" : "" // Push middle button outward (Right)
                        )}
                        animate={{
                            y: [0, -12, 0],
                            x: [0, -5, 0]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 6 + i, // Different duration for each
                            ease: "easeInOut",
                            delay: i * 0.7 // Different stagger
                        }}
                    >
                        <NavButton item={item} side="right" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
