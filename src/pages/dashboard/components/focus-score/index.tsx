import { Flame, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/animate-ui/components/animate/tooltip';
import { useFocusScore } from './use-focus-score';

const RING_SIZE = 80;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function FocusScore() {
  const { data, label, strokeColor, delta, maxItems, dayLabels, isLoading } = useFocusScore();

  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - data.score / 100);
  const thisWeekWidth = (data.thisWeekItems / maxItems) * 100;
  const lastWeekWidth = (data.lastWeekItems / maxItems) * 100;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">Focus Score</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-[120px] animate-pulse rounded-md border border-border-subtle bg-surface" />
          <div className="h-[120px] animate-pulse rounded-md border border-border-subtle bg-surface" />
          <div className="h-[120px] animate-pulse rounded-md border border-border-subtle bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">Focus Score</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="relative flex flex-row items-center justify-center gap-5 rounded-md border border-border-subtle bg-surface px-3 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="absolute top-2.5 right-2.5 cursor-pointer text-fg-disabled hover:text-fg-muted">
                <Info size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Weighted score based on streak length, week-over-week activity, and daily consistency
            </TooltipContent>
          </Tooltip>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={strokeColor}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[18px] font-semibold tabular-nums text-fg">
              {data.score}
              <span className="text-[12px] font-normal text-fg-muted">/100</span>
            </span>
            <span className="text-[11px] text-fg-muted">{label}</span>
          </div>
        </div>

        <div className="relative flex flex-col justify-between rounded-md border border-border-subtle bg-surface px-3 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="absolute top-2.5 right-2.5 cursor-pointer text-fg-disabled hover:text-fg-muted">
                <Info size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Consecutive days with activity: state changes, PRs, pushes, or approvals</TooltipContent>
          </Tooltip>
          <div className="flex flex-1 items-center justify-around">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Flame size={14} className="text-(--primary)" />
                <span className="text-[25px] font-bold tabular-nums text-fg">{data.streak}</span>
              </div>

              <span className="text-[11px] text-fg-muted">day streak</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] text-fg-muted">Best: {data.bestStreak} days</div>
              <div className="flex items-center gap-1.5">
                {data.weekDays.map((active, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${active ? 'bg-accent' : 'bg-border'}`} />
                    <span className="text-[9px] text-fg-disabled">{dayLabels[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col justify-between rounded-md border border-border-subtle bg-surface px-3 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="absolute top-2.5 right-2.5 cursor-pointer text-fg-disabled hover:text-fg-muted">
                <Info size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Total activities this week vs last week (state changes, PRs, pushes, approvals)</TooltipContent>
          </Tooltip>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-fg-muted">This Week</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${thisWeekWidth}%` }}
                  />
                </div>
                <span className="text-[13px] font-medium tabular-nums text-fg">{data.thisWeekItems}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-fg-muted">Last Week</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-fg-muted transition-all duration-500"
                    style={{ width: `${lastWeekWidth}%` }}
                  />
                </div>
                <span className="text-[13px] font-medium tabular-nums text-fg">{data.lastWeekItems}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {delta >= 0 ? (
              <TrendingUp size={12} className="text-success" />
            ) : (
              <TrendingDown size={12} className="text-error" />
            )}
            <span className={delta >= 0 ? 'text-success' : 'text-error'}>
              {delta >= 0 ? '+' : ''}
              {delta}
            </span>
            <span className="text-fg-muted">vs last week</span>
          </div>
        </div>
      </div>
    </div>
  );
}
