import { useState } from 'react';
import { themeManager } from '@/lib/theme-manager';
import { useThemeStore } from '@/store/theme';
import { ThemePreset } from '@/types/theme';
import { ThemeCard } from '../theme-card';
import { SunburnDialog } from '../sunburn-dialog';

export function ThemePicker() {
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-fg">Theme</span>
        <span className="text-sm text-fg-muted">Choose a visual preset for the app</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {themeManager.presets.map((preset) => (
          <ThemeCard
            key={preset.id}
            preset={preset}
            active={currentTheme === preset.id}
            onSelect={() => handleThemeSelect(preset.id)}
          />
        ))}
      </div>

      <SunburnDialog
        open={sunburnDialogOpen}
        onConfirm={handleSunburnConfirm}
        onCancel={() => setSunburnDialogOpen(false)}
      />
    </div>
  );
}
