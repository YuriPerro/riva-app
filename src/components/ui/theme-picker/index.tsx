import { ThemeCard } from '@/components/ui/theme-card';
import { SunburnDialog } from '@/components/ui/sunburn-dialog';
import { useThemePicker } from './use-theme-picker';

export function ThemePicker() {
  const { currentTheme, presets, sunburnDialogOpen, handleThemeSelect, handleSunburnConfirm, handleSunburnCancel } =
    useThemePicker();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-fg">Theme</span>
        <span className="text-sm text-fg-muted">Choose a visual preset for the app</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {presets.map((preset) => (
          <ThemeCard
            key={preset.id}
            preset={preset}
            active={currentTheme === preset.id}
            onSelect={() => handleThemeSelect(preset.id)}
          />
        ))}
      </div>

      <SunburnDialog open={sunburnDialogOpen} onConfirm={handleSunburnConfirm} onCancel={handleSunburnCancel} />
    </div>
  );
}
