import { create } from 'zustand';

interface UIState {
    isLoginOpen: boolean;
    setLoginOpen: (isOpen: boolean) => void;
    // Navigation Animation State
    navState: 'idle' | 'grabbing' | 'expanding' | 'redirecting';
    setNavState: (state: 'idle' | 'grabbing' | 'expanding' | 'redirecting') => void;
}

export const useUIStore = create<UIState>((set) => ({
    isLoginOpen: false,
    setLoginOpen: (isOpen) => set({ isLoginOpen: isOpen }),
    navState: 'idle',
    setNavState: (state) => set({ navState: state }),
}));
