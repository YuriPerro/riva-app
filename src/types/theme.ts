export enum ThemePreset {
  Midnight = 'midnight',
  Phosphor = 'phosphor',
  Dracula = 'dracula',
  Monochrome = 'monochrome',
  Crimson = 'crimson',
  Catppuccin = 'catppuccin',
  Sunburn = 'sunburn',
  Claude = 'claude',
  RedDead = 'red-dead',
}

export interface ThemePresetConfig {
  id: ThemePreset;
  label: string;
  font: string;
  accent: string;
  base: string;
  surface: string;
}
