import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { usePeriodSelector } from './use-period-selector';
import type { PeriodSelectorProps } from './types';

export function PeriodSelector(props: PeriodSelectorProps) {
  const { value, onChange } = props;
  const { ref, open, toggle, select } = usePeriodSelector(onChange);
  const { t } = useTranslation('dashboard');
  const periods = useMemo(() => {
    const weekdayPeriods = [
      { value: 1, label: t('periodSelector.yesterday') },
      { value: 2, label: t('periodSelector.last2Days') },
      { value: 3, label: t('periodSelector.last3Days') },
    ];
    const mondayPeriods = [
      { value: 3, label: t('periodSelector.lastFriday') },
      { value: 4, label: t('periodSelector.last4Days') },
      { value: 5, label: t('periodSelector.last5Days') },
    ];
    return dayjs().day() === 1 ? mondayPeriods : weekdayPeriods;
  }, [t]);
  const current = periods.find((p) => p.value === value) ?? periods[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] text-fg-muted transition-colors hover:text-fg"
      >
        {current.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[120px] rounded-md border border-border bg-overlay p-1 shadow-lg">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => select(p.value)}
              className={cn(
                'flex w-full cursor-pointer rounded px-2 py-1 text-left text-[11px] transition-colors',
                p.value === value ? 'bg-elevated text-fg' : 'text-fg-muted hover:bg-elevated hover:text-fg',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
