"use client";

import { LucideIcon, FileText, Utensils, Camera, Feather, BookOpen, User } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";

interface NavItem {
    label: string;
    icon: LucideIcon;
    href: string;
}

const leftItems: NavItem[] = [
    { label: "ARTICLES", icon: FileText, href: "/articles" },
    { label: "RECIPES", icon: Utensils, href: "/recipes" },
    { label: "PHOTOS", icon: Camera, href: "/photos" },
];

const rightItemsFixed: NavItem[] = [
    { label: "POEMS", icon: Feather, href: "/poems" },
    { label: "STORIES", icon: BookOpen, href: "/stories" },
    { label: "ABOUT", icon: User, href: "/about" },
];



function NavButton({ item, side, onClick }: { item: NavItem, side: 'left' | 'right', onClick: (e: React.MouseEvent) => void }) {
    const isLoginOpen = useUIStore((state) => state.isLoginOpen);
    const navState = useUIStore((state) => state.navState);

    return (
        <a href={item.href} onClick={onClick} className={clsx(
            "group relative flex items-center justify-between gap-4 p-2 w-72 transition-all duration-300",
            side === 'left' ? "flex-row-reverse text-right" : "flex-row text-left",
            // Pause interactions if Login is Open or Navigating
            (isLoginOpen || navState !== 'idle') ? "pointer-events-none opacity-50 grayscale" : "hover:scale-105 pointer-events-auto"
        )}>
            {/* Text Label */}
            <span className={clsx(
                "text-primary-text font-bold tracking-widest transition-opacity duration-300 whitespace-nowrap",
                "text-lg drop-shadow-[0_0_5px_var(--primary-glow)]"
            )}>
                {item.label}
            </span>

            {/* Circle Button */}
            <div className="relative w-16 h-16 rounded-full border-2 border-primary bg-glass flex items-center justify-center
                          shadow-[0_0_15px_var(--primary-glow)] group-hover:shadow-[0_0_25px_var(--primary-glow)]
                          group-hover:border-white transition-all duration-300">
                <item.icon className="w-8 h-8 text-primary-text group-hover:text-white transition-colors" />
            </div>

            {/* Connecting Line (Decorative) - Moved to be "under" text */}
            <div className={clsx(
                "absolute bottom-0 w-12 h-[2px] bg-secondary-dark -z-10 group-hover:bg-primary transition-colors",
                side === 'left' ? "right-10 translate-x-full" : "left-10 -translate-x-full"
            )} />
        </a>
    );
}

export default function NavigationMenu() {
    const router = useRouter();
    const isLoginOpen = useUIStore((state) => state.isLoginOpen);
    const setLoginOpen = useUIStore((state) => state.setLoginOpen);
    const navState = useUIStore((state) => state.navState);
    const setNavState = useUIStore((state) => state.setNavState);

    const [activeItem, setActiveItem] = useState<NavItem | null>(null);

    const handleNavClick = async (e: React.MouseEvent, item: NavItem) => {
        e.preventDefault();
        if (navState !== 'idle') return;

        setActiveItem(item);
        setNavState('grabbing');

        // Sequence: 
        // 1. Grabbing (Move to Center) - 1s duration
        // 2. Expanding (Fill Screen) - after 1s
        // 3. Redirect - after 1.5s total

        setTimeout(() => {
            setNavState('expanding');
        }, 800);

        setTimeout(() => {
            setNavState('redirecting');
            router.push(item.href);

            // Cleanup after redirect (give time for page load)
            setTimeout(() => {
                setNavState('idle');
                setActiveItem(null);
            }, 1000);
        }, 1400);
    };



    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex justify-between items-center px-20">
            {/* Left Menu Items - Individual Floating Windows */}
            <div className="flex flex-col gap-6 items-end">
                {leftItems.map((item, i) => (
                    <motion.div
                        key={i}
                        layoutId={`menu-item-${item.label}`}
                        className={clsx(
                            "p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto",
                            i === 1 ? "mr-12" : "", // Push middle button outward (Left)
                            (activeItem?.label === item.label) ? "opacity-0" : "opacity-100"
                        )}
                        animate={isLoginOpen ? {} : {
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
                        <NavButton item={item} side="left" onClick={(e) => handleNavClick(e, item)} />
                    </motion.div>
                ))}
            </div>

            {/* Right Menu Items - Individual Floating Windows */}
            <div className="flex flex-col gap-6 items-start">
                {rightItemsFixed.map((item, i) => (
                    <motion.div
                        key={i}
                        layoutId={`menu-item-${item.label}`}
                        className={clsx(
                            "p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto",
                            i === 1 ? "ml-12" : "", // Push middle button outward (Right)
                            // Hide the original item when it's the active one being animated
                            (activeItem?.label === item.label) ? "opacity-0" : "opacity-100"
                        )}
                        animate={isLoginOpen ? {} : {
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
                        <NavButton item={item} side="right" onClick={(e) => handleNavClick(e, item)} />
                    </motion.div>
                ))}
            </div>

            {/* --- GLOBAL ANIMATION OVERLAY --- */}
            <AnimatePresence>
                {activeItem && navState !== 'idle' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                        <motion.div
                            layoutId={`menu-item-${activeItem.label}`}
                            className="bg-black/80 backdrop-blur-xl border border-primary/50 shadow-[0_0_50px_var(--primary-glow)] overflow-hidden flex flex-col items-center justify-center rounded-2xl pointer-events-auto"
                            initial={{
                                width: 300,
                                height: 100
                            }}
                            animate={{
                                width: navState === 'expanding' || navState === 'redirecting' ? "100vw" : 400,
                                height: navState === 'expanding' || navState === 'redirecting' ? "100vh" : 200,
                                borderRadius: navState === 'expanding' || navState === 'redirecting' ? 0 : 24,
                                backgroundColor: navState === 'expanding' ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.8)"
                            }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                            {/* Content inside the expanding card */}
                            <motion.div
                                className="flex flex-col items-center gap-4"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: navState === 'expanding' ? 0 : 1 }}
                            >
                                <activeItem.icon size={64} className="text-primary-text drop-shadow-[0_0_15px_var(--primary-glow)]" />
                                <h2 className="text-4xl font-bold text-white tracking-widest">{activeItem.label}</h2>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
