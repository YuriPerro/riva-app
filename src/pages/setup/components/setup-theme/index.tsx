import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SunburnDialog } from '@/components/ui/sunburn-dialog';
import { useThemePicker } from '@/components/ui/theme-picker/use-theme-picker';

export function SetupTheme() {
  const { currentTheme, presets, sunburnDialogOpen, handleThemeSelect, handleSunburnConfirm, handleSunburnCancel } =
    useThemePicker();

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        {presets.map((preset) => {
          const active = currentTheme === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleThemeSelect(preset.id)}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-lg border transition-all',
                active ? 'border-transparent ring-1 ring-accent/40' : 'border-border hover:border-fg-disabled',
              )}
            >
              <div className="flex flex-col" style={{ backgroundColor: preset.base }}>
                <div className="flex items-center gap-2 px-2.5 py-2" style={{ backgroundColor: preset.surface }}>
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: preset.accent }} />
                  <span
                    className="truncate text-[11px] font-medium"
                    style={{ color: preset.accent === '#171717' ? '#71717a' : '#a1a1aa', fontFamily: preset.font }}
                  >
                    {preset.label}
                  </span>
                  {active && <Check size={11} className="ml-auto shrink-0 text-accent" />}
                </div>

                <div className="flex gap-1.5 px-2.5 py-2.5">
                  <div className="flex flex-1 flex-col gap-1 rounded p-1.5" style={{ backgroundColor: preset.surface }}>
                    <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: preset.accent, opacity: 0.7 }} />
                    <div className="h-1 w-full rounded-full" style={{ backgroundColor: preset.accent, opacity: 0.1 }} />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 rounded p-1.5" style={{ backgroundColor: preset.surface }}>
                    <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: preset.accent, opacity: 0.1 }} />
                    <div className="h-3 w-full rounded" style={{ backgroundColor: preset.accent, opacity: 0.12 }} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <SunburnDialog open={sunburnDialogOpen} onConfirm={handleSunburnConfirm} onCancel={handleSunburnCancel} />
    </>
  );
}
