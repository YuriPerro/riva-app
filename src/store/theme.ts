import { create } from 'zustand';
import type { ThemePreset } from '@/types/theme';
import { themeManager } from '@/lib/theme-manager';

interface ThemeState {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: themeManager.active,

  setTheme: (theme) => {
    themeManager.apply(theme);
    set({ theme });
  },
}));
