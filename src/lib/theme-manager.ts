import { ThemePreset } from '@/types/theme';
import type { ThemePresetConfig } from '@/types/theme';

const STORAGE_KEY = 'forge_theme';

const PRESETS: ThemePresetConfig[] = [
  {
    id: ThemePreset.Midnight,
    label: 'Midnight',
    font: 'Geist',
    accent: '#ff7e5f',
    base: '#0a0a0a',
    surface: '#111111',
  },
  {
    id: ThemePreset.Ocean,
    label: 'Ocean',
    font: 'Inter',
    accent: '#3b82f6',
    base: '#0b1120',
    surface: '#111827',
  },
  {
    id: ThemePreset.Ember,
    label: 'Ember',
    font: 'JetBrains Mono',
    accent: '#f97316',
    base: '#120a0a',
    surface: '#1a1010',
  },
  {
    id: ThemePreset.Forest,
    label: 'Forest',
    font: 'IBM Plex Sans',
    accent: '#22c55e',
    base: '#0a100a',
    surface: '#111a11',
  },
  {
    id: ThemePreset.Crimson,
    label: 'Crimson',
    font: 'Inter',
    accent: '#ff4632',
    base: '#1d1d1d',
    surface: '#292929',
  },
];

class ThemeManager {
  private current: ThemePreset;

  constructor() {
    this.current = this.load();
  }

  get presets(): ThemePresetConfig[] {
    return PRESETS;
  }

  get active(): ThemePreset {
    return this.current;
  }

  getPreset(id: ThemePreset): ThemePresetConfig {
    return PRESETS.find((t) => t.id === id) ?? PRESETS[0];
  }

  apply(id: ThemePreset): void {
    this.current = id;
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  init(): void {
    this.apply(this.current);
  }

  private load(): ThemePreset {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && PRESETS.some((t) => t.id === saved)) return saved as ThemePreset;
    return ThemePreset.Midnight;
  }
}

export const themeManager = new ThemeManager();
