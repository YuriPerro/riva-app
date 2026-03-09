import { useTranslation } from 'react-i18next';
import { FlameIcon } from '@/components/ui/flame';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { dayCircleClass } from '@/utils/streak';
import type { StreakSectionProps } from './types';

export function StreakSection(props: StreakSectionProps) {
  const { data } = props;
  const { t } = useTranslation('dashboard');

  const dayNames = [t('dayNames.mon'), t('dayNames.tue'), t('dayNames.wed'), t('dayNames.thu'), t('dayNames.fri'), t('dayNames.sat'), t('dayNames.sun')];
  const activeWorkdaysCount = data.weekDays.slice(0, 5).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="text-base">
          <span className="flex items-center gap-2">
            <FlameIcon size={18} className="text-accent" />
            {t('streak.details')}
          </span>
        </SheetTitle>
        <SheetDescription>
          {t('streak.description', { current: data.streak, best: data.bestStreak })}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">{t('streak.howItWorks')}</div>
          <ul className="flex flex-col gap-1.5 text-[12px] text-fg">
            <li>{t('streak.rules.consecutive')}</li>
            <li>{t('streak.rules.weekends')}</li>
            <li>{t('streak.rules.activities')}</li>
            <li>{t('streak.rules.persisted')}</li>
          </ul>
        </div>

        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">{t('focusScore.thisWeek')}</div>
          <div className="flex items-center gap-3">
            {data.weekDays.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`h-3 w-3 rounded-full ${dayCircleClass(i, active)}`} />
                <span className={`text-[11px] ${active ? 'font-medium text-fg' : 'text-fg-disabled'}`}>{dayNames[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-fg-muted">{t('streak.activeWorkdays', { count: activeWorkdaysCount })}</div>
        </div>

        {data.streak >= 7 && (
          <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2.5">
            <div className="text-[12px] text-accent">{t('streak.electricBorder')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
