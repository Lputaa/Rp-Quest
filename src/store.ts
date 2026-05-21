import { create } from 'zustand';
import { User } from 'firebase/auth';

export type Language = 'en' | 'id';

interface AppState {
  user: User | null;
  authLoading: boolean;
  language: Language;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  authLoading: true,
  language: 'id', // Default to indonesian
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setLanguage: (lang) => set({ language: lang }),
}));
