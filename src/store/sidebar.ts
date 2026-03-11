import { create } from 'zustand';
import type { SidebarState } from './types';

const STORAGE_KEY = 'riva_sidebar_collapsed';

function getStoredCollapsed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: getStoredCollapsed(),
  toggle: () =>
    set((s) => {
      const next = !s.collapsed;
      localStorage.setItem(STORAGE_KEY, String(next));
      return { collapsed: next };
    }),
}));
