import type { ThemePresetConfig } from "@/types/theme";

export interface ThemeCardProps {
  preset: ThemePresetConfig;
  active: boolean;
  onSelect: () => void;
}
