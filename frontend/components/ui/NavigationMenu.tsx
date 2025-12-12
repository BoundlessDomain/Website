"use client";

import { LucideIcon, Home, User, Briefcase, FileText, Mail, Wrench } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

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

function NavButton({ item, side }: { item: NavItem, side: 'left' | 'right' }) {
    return (
        <a href={item.href} className={clsx(
            "group relative flex items-center gap-4 p-2 transition-all duration-300 hover:scale-105",
            side === 'left' ? "flex-row-reverse text-right" : "flex-row text-left"
        )}>
            {/* Text Label */}
            <span className={clsx(
                "text-cyan-400 font-bold tracking-widest transition-opacity duration-300",
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
    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex justify-between items-center px-20">
            {/* Logo - Top Left */}
            <div className="absolute top-8 left-8 pointer-events-auto">
                <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            </div>

            {/* Login Button - Top Right */}
            <div className="absolute top-8 right-8 pointer-events-auto">
                <button className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold tracking-wider rounded-full 
                                   shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)]
                                   hover:scale-110 transition-all duration-300 border border-cyan-400/30">
                    LOGIN
                </button>
            </div>

            {/* Left Menu Items - Individual Floating Windows */}
            <div className="flex flex-col gap-6">
                {leftItems.map((item, i) => (
                    <motion.div
                        key={i}
                        className="p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto"
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
            <div className="flex flex-col gap-6">
                {rightItemsFixed.map((item, i) => (
                    <motion.div
                        key={i}
                        className="p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto"
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
