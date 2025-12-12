"use client";

import { LucideIcon, Home, User, Briefcase, FileText, Mail, Wrench } from "lucide-react";
import clsx from "clsx";

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

const rightItems: NavItem[] = [
    { label: "ABOUT", icon: User, href: "/about-2" }, // Kept as requested in image, presumably Portfolio/About split
    { label: "PORTFOLIO", icon: Briefcase, href: "/portfolio" },
    { label: "BLOG", icon: FileText, href: "/blog" },
    { label: "CONTACT", icon: Mail, href: "/contact" },
];

// Cleaned up list based on typical usage (User requested "About, Portfolio, Blog, Contact" on right)
// The image showed 4 circles on right? Let's stick to the 3v3 symmetry from the text description unless specified.
// Text said: "3 Circular Buttons on left, 3 on right."
// Let's adjust rightItems to match 3.
const rightItemsFixed: NavItem[] = [
    { label: "PORTFOLIO", icon: Briefcase, href: "/portfolio" },
    { label: "BLOG", icon: FileText, href: "/blog" },
    { label: "CONTACT", icon: Mail, href: "/contact" },
];


function NavButton({ item, side }: { item: NavItem, side: 'left' | 'right' }) {
    return (
        <a href={item.href} className={clsx(
            "group relative flex items-center gap-4 p-4 transition-all duration-300 hover:scale-110",
            side === 'left' ? "flex-row-reverse text-right" : "flex-row text-left"
        )}>
            {/* Text Label */}
            <span className={clsx(
                "text-cyan-400 font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300",
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

            {/* Connecting Line (Decorative) */}
            <div className={clsx(
                "absolute top-1/2 w-12 h-[2px] bg-cyan-900 -z-10 group-hover:bg-cyan-500 transition-colors",
                side === 'left' ? "right-10 translate-x-full" : "left-10 -translate-x-full"
            )} />
        </a>
    );
}

export default function NavigationMenu() {
    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex justify-between items-center px-20">
            {/* Left Menu */}
            <div className="flex flex-col gap-12 pointer-events-auto">
                {leftItems.map((item, i) => (
                    <NavButton key={i} item={item} side="left" />
                ))}
            </div>

            {/* Right Menu */}
            <div className="flex flex-col gap-12 pointer-events-auto">
                {rightItemsFixed.map((item, i) => (
                    <NavButton key={i} item={item} side="right" />
                ))}
            </div>


        </div>
    );
}
