import { FlameIcon } from '@/components/ui/flame';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { dayCircleClass } from '@/utils/streak';
import type { StreakSectionProps } from './types';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StreakSection(props: StreakSectionProps) {
  const { data } = props;

  const activeWorkdaysCount = data.weekDays.slice(0, 5).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="text-base">
          <span className="flex items-center gap-2">
            <FlameIcon size={18} className="text-accent" />
            Streak Details
          </span>
        </SheetTitle>
        <SheetDescription>
          {data.streak} day current streak, {data.bestStreak} day best
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">How It Works</div>
          <ul className="flex flex-col gap-1.5 text-[12px] text-fg">
            <li>Counts consecutive workdays with at least one activity</li>
            <li>Weekends are automatically skipped (not counted as breaks)</li>
            <li>Activities: state changes, PRs, pushes, or approvals</li>
            <li>Best streak is persisted across sessions</li>
          </ul>
        </div>

        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">This Week</div>
          <div className="flex items-center gap-3">
            {data.weekDays.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`h-3 w-3 rounded-full ${dayCircleClass(i, active)}`} />
                <span className={`text-[11px] ${active ? 'font-medium text-fg' : 'text-fg-disabled'}`}>{DAY_NAMES[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-fg-muted">{activeWorkdaysCount}/5 active workdays this week</div>
        </div>

        {data.streak >= 7 && (
          <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2.5">
            <div className="text-[12px] text-accent">Electric border active at 7+ day streak</div>
          </div>
        )}
      </div>
    </div>
  );
}
