import { useState } from 'react';
import { themeManager } from '@/lib/theme-manager';
import { useThemeStore } from '@/store/theme';
import { ThemePreset } from '@/types/theme';
import type { ThemePresetConfig } from '@/types/theme';

export function useThemePicker() {
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [sunburnDialogOpen, setSunburnDialogOpen] = useState(false);

  function handleThemeSelect(id: ThemePreset) {
    if (id === ThemePreset.Sunburn) {
      setSunburnDialogOpen(true);
      return;
    }
    setTheme(id);
  }

  function handleSunburnConfirm() {
    setSunburnDialogOpen(false);
    setTheme(ThemePreset.Sunburn);
  }

  function handleSunburnCancel() {
    setSunburnDialogOpen(false);
  }

  const presets: ThemePresetConfig[] = themeManager.presets;

  return {
    currentTheme,
    presets,
    sunburnDialogOpen,
    handleThemeSelect,
    handleSunburnConfirm,
    handleSunburnCancel,
  };
}
