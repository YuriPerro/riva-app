export enum ThemePreset {
  Midnight = 'midnight',
  Phosphor = 'phosphor',
  Cobalt = 'cobalt',
  Vapor = 'vapor',
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
