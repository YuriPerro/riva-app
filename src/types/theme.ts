export enum ThemePreset {
  Midnight = 'midnight',
  Ocean = 'ocean',
  Ember = 'ember',
  Forest = 'forest',
  Crimson = 'crimson',
}

export interface ThemePresetConfig {
  id: ThemePreset;
  label: string;
  font: string;
  accent: string;
  base: string;
  surface: string;
}
