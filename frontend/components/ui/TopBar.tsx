"use client";

import { Home, LogOut } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import LoginModal from "./LoginModal";
import SettingsMenu from "./SettingsMenu";
import { supabase } from "@/utils/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { isAdmin } from "@/utils/roles";
import { useUIStore } from "@/store/uiStore";

function getNameFromEmail(email?: string) {
    if (!email) return "User";
    return email.split('@')[0];
}

export default function TopBar() {
    const isLoginOpen = useUIStore((state) => state.isLoginOpen);
    const setLoginOpen = useUIStore((state) => state.setLoginOpen);
    const [user, setUser] = useState<SupabaseUser | null>(null);

    const isOwner = useUIStore((state) => state.isOwner);
    const setOwner = useUIStore((state) => state.setOwner);
    const setLoggedIn = useUIStore((state) => state.setLoggedIn);

    useEffect(() => {
        const validateUser = async (session: any) => {
            const email = session?.user?.email;
            const id = session?.user?.id;

            if (!email || !id) {
                console.log("[Auth] Session cleared. Resetting Global State.");
                setUser(null);
                setOwner(false);
                setLoggedIn(false);
                return;
            }

            setUser(session.user);
            setLoggedIn(true);

            // Verify Owner
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/verify-owner`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, email })
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log("[Auth] Owner verified:", data.isOwner);
                    setOwner(data.isOwner);
                } else {
                    setOwner(false);
                }
            } catch (err) {
                console.error("[Auth] Verification failed", err);
                setOwner(false);
            }
        };

        // Get initial user
        supabase.auth.getSession().then(({ data: { session } }) => validateUser(session));

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            validateUser(session);
        });

        return () => subscription.unsubscribe();
    }, [setOwner, setLoggedIn]);

    const handleLogout = async () => {
        // Explicitly clear state immediately for UI responsiveness
        setOwner(false);
        setLoggedIn(false);
        setUser(null);
        await supabase.auth.signOut();
    };

    return (
        <div className="fixed top-0 left-0 w-full z-[60] pointer-events-none flex justify-between items-center px-6 py-6 md:px-12 md:py-8">
            {/* Login Modal */}
            <LoginModal isOpen={isLoginOpen} onClose={() => setLoginOpen(false)} />

            {/* Home Button - Top Left */}
            <div className="pointer-events-auto">
                <button
                    onClick={() => {
                        console.log("Home button clicked, pathname:", window.location.pathname);
                        if (window.location.pathname !== "/") {
                            console.log("Setting isExiting to true");
                            useUIStore.getState().setIsExiting(true);
                            // Fallback in case animation hangs
                            setTimeout(() => {
                                if (window.location.pathname !== "/") {
                                    window.location.href = "/";
                                }
                            }, 1000);
                        } else {
                            window.location.reload();
                        }
                    }}
                    className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary-glow bg-glass backdrop-blur-md
                                     hover:border-primary hover:shadow-[0_0_20px_var(--primary-glow)] transition-all duration-300 group"
                >
                    <Home className="w-6 h-6 text-primary-text group-hover:text-white transition-colors" />
                </button>
            </div>

            {/* Login/Profile - Top Right */}
            <div className="pointer-events-auto flex items-center gap-4">
                {/* Settings Menu - Always Accessible */}
                <SettingsMenu />

                {user ? (
                    <div className="flex items-center gap-4">
                        {/* Greeting */}
                        <div className="flex flex-col items-end mr-2 hidden md:flex">
                            <span className="text-primary-text font-bold tracking-wider text-sm drop-shadow-[0_0_5px_var(--primary-glow)]">
                                Hello, {user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.username || getNameFromEmail(user.email)}
                            </span>
                            {isOwner && (
                                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/50 px-2 py-0.5 rounded-full font-bold tracking-widest mt-1 shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                                    OWNER ACCESS
                                </span>
                            )}
                        </div>

                        {/* Profile Circle */}
                        <div className="w-12 h-12 rounded-full border-2 border-primary bg-glass backdrop-blur-md overflow-hidden relative shadow-[0_0_15px_var(--primary-glow)] group">
                            {user.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-secondary-dark">
                                    <span className="text-primary-text font-bold text-lg uppercase">
                                        {user.user_metadata?.username?.[0] || user.email?.[0] || "U"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Logout Mini Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-full bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                            title="Disconnect System"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setLoginOpen(true)}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold tracking-wider rounded-full 
                                       shadow-[0_0_15px_var(--primary-glow)] hover:shadow-[0_0_25px_var(--primary-glow)]
                                       hover:scale-110 transition-all duration-300 border border-primary-glow">
                        LOGIN
                    </button>
                )}
            </div>
        </div>
    );
}
