import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from 'firebase/auth';

export type Language = 'en' | 'id';

interface AppState {
  user: User | null;
  authLoading: boolean;
  language: Language;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setLanguage: (lang: Language) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      authLoading: true,
      language: 'id', // Default to indonesian
      sfxEnabled: true,
      musicEnabled: false,
      setUser: (user) => set({ user }),
      setAuthLoading: (loading) => set({ authLoading: loading }),
      setLanguage: (lang) => set({ language: lang }),
      setSfxEnabled: (enabled) => set({ sfxEnabled: enabled }),
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
    }),
    {
      name: 'rpg-tracker-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        language: state.language, 
        sfxEnabled: state.sfxEnabled,
        musicEnabled: state.musicEnabled
      }), // only persist these fields
    }
  )
);
