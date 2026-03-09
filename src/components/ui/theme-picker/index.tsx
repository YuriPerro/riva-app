import { useTranslation } from 'react-i18next';
import { Palette } from 'lucide-react';
import { ThemeCard } from '@/components/ui/theme-card';
import { SunburnDialog } from '@/components/ui/sunburn-dialog';
import { useThemePicker } from './use-theme-picker';

export function ThemePicker() {
  const { t } = useTranslation('settings');
  const { currentTheme, presets, sunburnDialogOpen, handleThemeSelect, handleSunburnConfirm, handleSunburnCancel } =
    useThemePicker();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-accent" />
          <span className="text-sm font-medium text-fg">{t('theme.title')}</span>
        </div>
        <span className="text-xs text-fg-muted">{t('theme.description')}</span>
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
