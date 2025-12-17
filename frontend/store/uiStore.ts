import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NavItemState {
    label: string;
    iconName: string; // Store string name to be serializable
    href: string;
}

interface UIState {
    isLoginOpen: boolean;
    setLoginOpen: (isOpen: boolean) => void;

    // Navigation Animation State
    navState: 'idle' | 'grabbing' | 'expanding' | 'redirecting';
    setNavState: (state: 'idle' | 'grabbing' | 'expanding' | 'redirecting') => void;

    isExiting: boolean;
    setIsExiting: (exiting: boolean) => void;

    returningLabel: string | null;
    setReturningLabel: (label: string | null) => void;

    // Feature: Low Power Mode
    isLowPowerMode: boolean;
    setLowPowerMode: (isLow: boolean) => void;

    // Feature: Debug Mode
    isDebugMode: boolean;
    setDebugMode: (debug: boolean) => Promise<void>;

    // Feature: Editable Navigation (Owners)
    isOwner: boolean;
    setOwner: (isOwner: boolean) => void;

    isLoggedIn: boolean;
    setLoggedIn: (isLoggedIn: boolean) => void;

    leftNavItems: NavItemState[];
    rightNavItems: NavItemState[];

    // Actions
    fetchNavData: () => Promise<void>;
    updateNavItem: (side: 'left' | 'right', index: number, newItem: NavItemState) => Promise<void>;
}

// Default Items (Fallback)
const defaultLeftItems: NavItemState[] = [
    { label: "ARTICLES", iconName: "FileText", href: "/articles" },
    { label: "RECIPES", iconName: "Utensils", href: "/recipes" },
    { label: "GALLERY", iconName: "Camera", href: "/gallery" },
];

const defaultRightItems: NavItemState[] = [
    { label: "POEMS", iconName: "Feather", href: "/poems" },
    { label: "STORIES", iconName: "BookOpen", href: "/stories" },
    { label: "ABOUT", iconName: "User", href: "/about" },
];

export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            isLoginOpen: false,
            setLoginOpen: (isOpen) => set({ isLoginOpen: isOpen }),

            navState: 'idle',
            setNavState: (state) => set({ navState: state }),

            isExiting: false,
            setIsExiting: (exiting) => set({ isExiting: exiting }),

            returningLabel: null,
            setReturningLabel: (label) => set({ returningLabel: label }),

            isLowPowerMode: false,
            setLowPowerMode: (isLow) => set({ isLowPowerMode: isLow }),

            isDebugMode: false,
            // setDebugMode is defined as async action below

            isOwner: false, // Default false, set by Auth
            setOwner: (isOwner) => set({ isOwner }),

            isLoggedIn: false,
            setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),

            leftNavItems: defaultLeftItems,
            rightNavItems: defaultRightItems,

            fetchNavData: async () => {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/navigation`);
                    if (res.ok) {
                        const data = await res.json();
                        set({
                            leftNavItems: data.leftNavItems,
                            rightNavItems: data.rightNavItems,
                            isDebugMode: data.isDebugMode
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch nav data", error);
                }
            },

            updateNavItem: async (side, index, newItem) => {
                // ... existing update logic ...
                const state = get();
                const newLeft = side === 'left' ? [...state.leftNavItems] : state.leftNavItems;
                const newRight = side === 'right' ? [...state.rightNavItems] : state.rightNavItems;

                if (side === 'left') newLeft[index] = newItem;
                else newRight[index] = newItem;

                set({ leftNavItems: newLeft, rightNavItems: newRight });

                // Sync to Backend
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/navigation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leftNavItems: newLeft,
                            rightNavItems: newRight,
                            isDebugMode: state.isDebugMode
                        })
                    });
                } catch (error) {
                    console.error("Failed to save nav data", error);
                }
            },

            setDebugMode: async (debug) => {
                set({ isDebugMode: debug });
                const state = get();
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/navigation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leftNavItems: state.leftNavItems,
                            rightNavItems: state.rightNavItems,
                            isDebugMode: debug
                        })
                    });
                } catch (error) {
                    console.error("Failed to save global debug mode", error);
                }
            }
        }),
        {
            name: 'ui-storage-v2',
            // Persist relevant fields locally as cache? 
            // Actually, let's NOT persist navItems locally so we always fetch fresh from server?
            // But for offline support/speed it's nice.
            // Let's keep it but `fetchNavData` will overwrite.
            partialize: (state) => ({
                isLowPowerMode: state.isLowPowerMode,
                // leftNavItems: state.leftNavItems, // Don't persist locally, trust server? 
                // rightNavItems: state.rightNavItems, // Or persist to avoid empty flash
                leftNavItems: state.leftNavItems,
                rightNavItems: state.rightNavItems,
                isOwner: state.isOwner,
                isDebugMode: state.isDebugMode
            }),
        }
    )
);
