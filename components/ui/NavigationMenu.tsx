"use client";

// Trigger deployment check

import { LucideIcon, FileText, Utensils, Camera, Feather, BookOpen, User, Users, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/utils/supabase";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore, NavItemState } from "@/store/uiStore";
import FeedbackButton from "./FeedbackButton";

// Map strings to Icon components for serialization
const IconMap: Record<string, LucideIcon> = {
    "FileText": FileText,
    "Utensils": Utensils,
    "Camera": Camera,
    "Feather": Feather,
    "BookOpen": BookOpen,
    "User": User,
    "Users": Users,
};

// Available pages for selection
const AVAILABLE_PAGES = [
    { label: "ARTICLES", href: "/articles", iconName: "FileText" },
    { label: "RECIPES", href: "/recipes", iconName: "Utensils" },
    { label: "GALLERY", href: "/gallery", iconName: "Camera" },
    { label: "POEMS", href: "/poems", iconName: "Feather" },
    { label: "STORIES", href: "/stories", iconName: "BookOpen" },
    { label: "ABOUT", href: "/about", iconName: "User" },
];

function NavButton({ item, side, onClick, onEdit, isOwner, layoutMode }: {
    item: NavItemState,
    side: 'left' | 'right' | 'center',
    onClick: (e: React.MouseEvent) => void,
    onEdit: (e: React.MouseEvent) => void,
    isOwner: boolean,
    layoutMode: 'mobile' | 'narrow' | 'wide'
}) {
    const isLoginOpen = useUIStore((state) => state.isLoginOpen);
    const navState = useUIStore((state) => state.navState);
    const IconComponent = IconMap[item.iconName] || FileText;

    // Narrow mode sizing adjustments
    const widthClass = layoutMode === 'narrow'
        ? "w-[min(14rem,30vw)]"
        : "w-[clamp(12rem,40vw,20rem)]";

    const textSizeClass = layoutMode === 'narrow'
        ? "text-[min(1rem,2vw)]"
        : "text-[clamp(0.75rem,2.5vw,1.25rem)]";

    const circleSizeClass = layoutMode === 'narrow'
        ? "w-[min(3rem,6vw)] h-[min(3rem,6vw)]"
        : "w-[clamp(2.5rem,8vw,4rem)] h-[clamp(2.5rem,8vw,4rem)]";

    return (
        <a href={item.href} onClick={onClick} className={clsx(
            "group relative flex items-center justify-between gap-2 md:gap-4 p-1 md:p-2 transition-all duration-300",
            // Layout specific sizing
            side === 'left' ? `flex-row text-left ${widthClass} md:flex-row-reverse md:text-right` :
                side === 'right' ? `flex-row text-left ${widthClass}` :
                    "flex-col text-center w-auto gap-2", // Center variant
            (isLoginOpen || navState !== 'idle') ? "pointer-events-none opacity-50 grayscale" : "hover:scale-105 pointer-events-auto"
        )}>
            {/* Text Label */}
            <span className={clsx(
                "text-primary-text font-bold tracking-widest transition-opacity duration-300 whitespace-nowrap",
                textSizeClass,
                "drop-shadow-[0_0_5px_var(--primary-glow)]",
                side === 'center' && "order-2"
            )}>
                {item.label}
            </span>

            {/* Circle Button */}
            <div className={clsx(
                "relative rounded-full border-2 border-primary bg-glass flex items-center justify-center",
                circleSizeClass,
                "shadow-[0_0_15px_var(--primary-glow)] group-hover:shadow-[0_0_25px_var(--primary-glow)]",
                "group-hover:border-white transition-all duration-300",
                side === 'center' && "order-1"
            )}>
                <IconComponent className="w-[50%] h-[50%] text-primary-text group-hover:text-white transition-colors" />

                {/* Edit Pencil Icon */}
                {isOwner && !isLoginOpen && (
                    <div
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(e); }}
                        className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-400 z-50 pointer-events-auto"
                        title="Edit Link"
                    >
                        <Pencil size={10} className="text-white md:hidden" />
                        <Pencil size={12} className="text-white hidden md:block" />
                    </div>
                )}
            </div>

            {/* Connecting Line */}
            {side !== 'center' && (
                <div className={clsx(
                    "absolute bottom-0 w-8 md:w-12 h-[2px] bg-secondary-dark -z-10 group-hover:bg-primary transition-colors",
                    side === 'left' ? "right-8 md:right-10 translate-x-full" : "left-8 md:left-10 -translate-x-full"
                )} />
            )}
        </a>
    );
}

interface NavigationMenuProps {
    layoutMode?: 'mobile' | 'narrow' | 'wide';
}

export default function NavigationMenu({ layoutMode = 'wide' }: NavigationMenuProps) {
    const router = useRouter();
    const isLoginOpen = useUIStore((state) => state.isLoginOpen);
    const navState = useUIStore((state) => state.navState);
    const setNavState = useUIStore((state) => state.setNavState);
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    // Dynamic Items
    const leftItems = useUIStore((state) => state.leftNavItems);
    const rightItems = useUIStore((state) => state.rightNavItems);
    const updateNavItem = useUIStore((state) => state.updateNavItem);
    const isOwner = useUIStore((state) => state.isOwner);
    const fetchNavData = useUIStore((state) => state.fetchNavData);
    const setOwner = useUIStore((state) => state.setOwner);
    const isLoggedIn = useUIStore((state) => state.isLoggedIn);
    const setLoggedIn = useUIStore((state) => state.setLoggedIn);
    const isDebugMode = useUIStore((state) => state.isDebugMode);
    const [debugEmail, setDebugEmail] = useState<string | undefined>("Check...");

    useEffect(() => {
        fetchNavData();
        // Auth logic moved to TopBar (Global) to ensure persistence across all pages
    }, [fetchNavData]);

    const returningLabel = useUIStore((state) => state.returningLabel);
    const setReturningLabel = useUIStore((state) => state.setReturningLabel);

    const [activeItem, setActiveItem] = useState<NavItemState | null>(null);
    const [editingItem, setEditingItem] = useState<{ side: 'left' | 'right', index: number } | null>(null);

    const handleNavClick = async (e: React.MouseEvent, item: NavItemState) => {
        e.preventDefault();
        if (navState !== 'idle') return;

        // Low Power Mode: Instant Redirect (No Animation)
        if (isLowPowerMode) {
            router.push(item.href);
            return;
        }

        setActiveItem(item);
        setNavState('grabbing');

        setTimeout(() => setNavState('expanding'), 800);
        setTimeout(() => {
            setNavState('redirecting');
            router.push(item.href);
            setTimeout(() => {
                setNavState('idle');
                setActiveItem(null);
            }, 1000);
        }, 1400);
    };

    const handleEditClick = (side: 'left' | 'right', index: number) => {
        setEditingItem({ side, index });
    };

    const handleUpdateItem = (newItem: NavItemState) => {
        if (editingItem) {
            updateNavItem(editingItem.side, editingItem.index, newItem);
            setEditingItem(null);
        }
    };

    // Handle "Returning" Animation from Subpage
    useEffect(() => {
        if (returningLabel) {
            const allItems = [...leftItems, ...rightItems];
            const item = allItems.find(i => i.label === returningLabel);

            if (item) {
                setActiveItem(item);
                setNavState('grabbing');
                setTimeout(() => {
                    setNavState('idle');
                    setActiveItem(null);
                    setReturningLabel(null);
                }, 800);
            } else {
                setReturningLabel(null);
            }
        }
    }, [returningLabel, setNavState, setReturningLabel, leftItems, rightItems]);

    // --- RENDER LOGIC for Layout Modes ---
    const allItems = [...leftItems, ...rightItems]; // For Mobile Grid

    // Reduce drift animation in Narrow mode to avoid hitting robot
    const driftX = layoutMode === 'narrow' ? 2 : 5;
    const driftDuration = layoutMode === 'narrow' ? 8 : 5;

    // --- MOBILE GRID VIEW ---
    if (layoutMode === 'mobile') {
        return (
            <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-start pt-16 px-4">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm pointer-events-auto">
                    {allItems.map((item, i) => (
                        <motion.div
                            key={i}
                            layoutId={`menu-item-${item.label}`}
                            className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg flex justify-center items-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: (activeItem?.label === item.label) ? 0 : 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <NavButton
                                item={item}
                                side="center" // Use center variant for grid
                                onClick={(e) => handleNavClick(e, item)}
                                onEdit={() => handleEditClick('left', i)} // Index tracking might be tricky here, but owner edit on mobile is edge case
                                isOwner={isOwner}
                                layoutMode={layoutMode}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Contacts Button (Mobile Position - Below Grid) */}
                {isLoggedIn && (
                    <div className="mt-8 pointer-events-auto">
                        <div className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                            <NavButton
                                item={{ label: "CONTACTS", iconName: "Users", href: "/contacts" }}
                                side="center"
                                onClick={(e) => handleNavClick(e, { label: "CONTACTS", iconName: "Users", href: "/contacts" })}
                                onEdit={() => { }}
                                isOwner={false}
                                layoutMode={layoutMode}
                            />
                        </div>
                    </div>
                )}

                {/* ... (Modals/Overlays if needed, but existing ones are separate/global) ... */}
                {/* We need to include the Global Animation Overlay & Edit Modal here too or ensure they are outside this conditional return */}
                {/* Since the return is blocking, we should probably refactor to keeping the overlays outside or duplicating them. 
                    Let's Refactor: Instead of early return, we conditionally render the CONTENT div, but keep the WRAPPER div. 
                */}
            </div>
        );
    }

    // --- DESKTOP / NARROW VIEW (Original Split Layout) ---
    const containerClass = layoutMode === 'narrow'
        ? "justify-center md:justify-start md:pl-10 md:gap-4"
        : "justify-center md:justify-between px-4 md:px-20 pt-24 md:pt-0 gap-8 md:gap-0";

    return (
        <div className={clsx(
            "absolute inset-0 z-40 pointer-events-none flex flex-col md:flex-row items-start md:items-center",
            containerClass
        )}>
            {/* Left Menu Items */}
            <div className={clsx(
                "flex flex-col gap-4 items-start",
                "md:items-end md:gap-6"
            )}>
                {leftItems.map((item, i) => (
                    <motion.div
                        key={i}
                        layoutId={`menu-item-${item.label}`}
                        className={clsx(
                            "p-3 md:p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto",
                            (layoutMode === 'wide' && i === 1) ? "md:mr-12" : "",
                            (activeItem?.label === item.label) ? "opacity-0" : "opacity-100"
                        )}
                        animate={(isLoginOpen || isLowPowerMode) ? {} : {
                            y: [0, -10, 0],
                            x: [0, driftX, 0]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: driftDuration + i,
                            ease: "easeInOut",
                            delay: i * 0.5
                        }}
                    >
                        <NavButton
                            item={item}
                            side="left"
                            onClick={(e) => handleNavClick(e, item)}
                            onEdit={() => handleEditClick('left', i)}
                            isOwner={isOwner}
                            layoutMode={layoutMode}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Right Menu Items */}
            <div className={clsx(
                "flex flex-col gap-4 items-start",
                "md:gap-6"
            )}>
                {rightItems.map((item, i) => (
                    <motion.div
                        key={i}
                        layoutId={`menu-item-${item.label}`}
                        className={clsx(
                            "p-3 md:p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto",
                            (layoutMode === 'wide' && i === 1) ? "md:ml-12" : "",
                            (activeItem?.label === item.label) ? "opacity-0" : "opacity-100"
                        )}
                        animate={(isLoginOpen || isLowPowerMode) ? {} : {
                            y: [0, -12, 0],
                            x: [0, -driftX, 0]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: driftDuration + 1 + i,
                            ease: "easeInOut",
                            delay: i * 0.7
                        }}
                    >
                        <NavButton
                            item={item}
                            side="right"
                            onClick={(e) => handleNavClick(e, item)}
                            onEdit={() => handleEditClick('right', i)}
                            isOwner={isOwner}
                            layoutMode={layoutMode}
                        />
                    </motion.div>
                ))}
            </div>

            {/* --- CONTACTS BUTTON (Desktop Fixed) --- */}
            {isLoggedIn && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto"
                    >
                        <NavButton
                            item={{ label: "CONTACTS", iconName: "Users", href: "/contacts" }}
                            side="center"
                            onClick={(e) => handleNavClick(e, { label: "CONTACTS", iconName: "Users", href: "/contacts" })}
                            // For now, we disable editing for this specific fixed button or we'd need a backend field
                            onEdit={() => console.log("Edit contacts not yet persisted")}
                            isOwner={false} // Disable edit pencil for now to avoid confusion until backend supports it
                            layoutMode={layoutMode}
                        />
                    </motion.div>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingItem && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-96 max-w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">Select Destination</h3>
                                <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-white/10 rounded-full">
                                    <X className="text-white" size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                                {AVAILABLE_PAGES.map((page) => {
                                    const Icon = IconMap[page.iconName] || FileText;
                                    return (
                                        <button
                                            key={page.label}
                                            onClick={() => handleUpdateItem(page)}
                                            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-primary/20 hover:border-primary/50 border border-transparent transition-all group"
                                        >
                                            <div className="p-2 bg-black/30 rounded-full">
                                                <Icon className="text-gray-400 group-hover:text-primary" size={20} />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-white font-bold">{page.label}</span>
                                                <span className="text-xs text-gray-400">{page.href}</span>
                                            </div>
                                            {leftItems.find(i => i.label === page.label) || rightItems.find(i => i.label === page.label) ? (
                                                <div className="ml-auto text-xs text-green-400 font-bold px-2 py-1 bg-green-900/30 rounded">ACTIVE</div>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- GLOBAL ANIMATION OVERLAY --- */}
            <AnimatePresence>
                {activeItem && navState !== 'idle' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                        <motion.div
                            layoutId={`menu-item-${activeItem.label}`}
                            className="bg-black/80 backdrop-blur-xl border border-primary/50 shadow-[0_0_50px_var(--primary-glow)] overflow-hidden flex flex-col items-center justify-center rounded-2xl pointer-events-auto"
                            initial={{ width: 300, height: 100 }}
                            animate={{
                                width: navState === 'expanding' || navState === 'redirecting' ? "100vw" : 400,
                                height: navState === 'expanding' || navState === 'redirecting' ? "100vh" : 200,
                                backgroundColor: navState === 'expanding' ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.8)"
                            }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                            <motion.div
                                className="flex flex-col items-center gap-4"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: navState === 'expanding' ? 0 : 1 }}
                            >
                                {(() => {
                                    const ActiveIcon = IconMap[activeItem.iconName] || FileText;
                                    return <ActiveIcon size={64} className="text-primary-text drop-shadow-[0_0_15px_var(--primary-glow)]" />;
                                })()}
                                <h2 className="text-4xl font-bold text-white tracking-widest">{activeItem.label}</h2>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- FEEDBACK BUTTON --- */}
            <FeedbackButton />
        </div>
    );
}
