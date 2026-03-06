import { themeManager } from '@/lib/theme-manager';
import { useThemeStore } from '@/store/theme';
import { ThemeCard } from './theme-card';

export function ThemePicker() {
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

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
            onSelect={() => setTheme(preset.id)}
          />
        ))}
      </div>
    </div>
  );
}
