import { create } from 'zustand';

interface UIState {
    isLoginOpen: boolean;
    setLoginOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isLoginOpen: false,
    setLoginOpen: (isOpen) => set({ isLoginOpen: isOpen }),
}));
