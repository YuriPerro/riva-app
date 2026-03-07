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
    id: ThemePreset.Phosphor,
    label: 'Phosphor',
    font: 'JetBrains Mono',
    accent: '#00ff41',
    base: '#050505',
    surface: '#0a0a0a',
  },
  {
    id: ThemePreset.Dracula,
    label: 'Dracula',
    font: 'Geist',
    accent: '#BD93F9',
    base: '#282A36',
    surface: '#2d303e',
  },
  {
    id: ThemePreset.Monochrome,
    label: 'Monochrome',
    font: 'Geist',
    accent: '#ededed',
    base: '#000000',
    surface: '#0a0a0a',
  },
  {
    id: ThemePreset.Crimson,
    label: 'Crimson',
    font: 'Inter',
    accent: '#ff4632',
    base: '#1d1d1d',
    surface: '#292929',
  },
  {
    id: ThemePreset.Catppuccin,
    label: 'Catppuccin',
    font: 'Geist',
    accent: '#CBA6F7',
    base: '#1E1E2E',
    surface: '#252536',
  },
  {
    id: ThemePreset.Sunburn,
    label: 'Sunburn',
    font: 'Geist',
    accent: '#171717',
    base: '#ffffff',
    surface: '#f5f5f5',
  },
  {
    id: ThemePreset.Claude,
    label: 'Claude+',
    font: 'Outfit',
    accent: '#d4845a',
    base: '#262524',
    surface: '#2c2b29',
  },
  {
    id: ThemePreset.RedDead,
    label: 'Red Dead',
    font: 'Inter',
    accent: '#c62828',
    base: '#0a0c0d',
    surface: '#111416',
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
