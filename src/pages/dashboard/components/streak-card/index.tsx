import { Info } from 'lucide-react';
import { FlameIcon } from '@/components/ui/flame';
import { dayCircleClass } from '@/utils/streak';
import type { StreakCardProps } from './types';

export function StreakCard(props: StreakCardProps) {
  const { data, dayLabels, electric, onInfoClick } = props;

  return (
    <div className={`relative flex h-full flex-col justify-between rounded-md bg-surface px-3 py-4 ${electric ? '' : 'border border-border-subtle'}`}>
      <button
        onClick={onInfoClick}
        className="absolute top-2.5 right-2.5 cursor-pointer text-fg-disabled hover:text-fg-muted"
      >
        <Info size={12} />
      </button>
      <div className="flex flex-1 items-center justify-around">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <div className="relative flex items-center justify-center">
              {data.streak >= 2 && <div className="absolute h-6 w-6 rounded-full bg-accent/30 blur-md" />}
              <FlameIcon size={16} className="relative text-accent" />
            </div>
            <span className="text-[28px] font-bold tabular-nums text-fg">{data.streak}</span>
          </div>

          <span className="text-[11px] text-fg-muted">day streak</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[11px] text-fg-muted">Best: {data.bestStreak} days</div>
          <div className="flex items-center gap-1.5">
            {data.weekDays.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${dayCircleClass(i, active)}`} />
                <span className="text-[9px] text-fg-disabled">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
