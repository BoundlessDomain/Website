import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    isLowPowerMode: boolean;
    setLowPowerMode: (isLow: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'ui-storage', // unique name
            partialize: (state) => ({ isLowPowerMode: state.isLowPowerMode }), // Only persist low power mode
        }
    )
);
