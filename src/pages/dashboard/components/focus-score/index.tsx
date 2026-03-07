import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import ElectricBorder from '@/components/ElectricBorder';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { StreakCard } from '../streak-card';
import { FocusScoreDrawer } from '../focus-score-drawer';
import { useFocusScore } from './use-focus-score';

const RING_SIZE = 80;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function FocusScore() {
  const {
    data, tier, label, strokeColor, delta, maxItems, dayLabels,
    activeCard, openDrawer, closeDrawer,
    streakPts, comparisonPts, consistencyPts,
  } = useFocusScore();

  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - data.score / 100);
  const thisWeekWidth = (data.thisWeekItems / maxItems) * 100;
  const lastWeekWidth = (data.lastWeekItems / maxItems) * 100;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">Focus Score</h3>
      <div className="grid grid-cols-3 gap-3">
        <div
          className="relative flex flex-row items-center justify-center gap-5 rounded-md border border-border-subtle bg-surface px-3 py-4 opacity-0"
          style={{ animation: 'card-enter 400ms cubic-bezier(0.22, 1, 0.36, 1) 100ms forwards' }}
        >
          <button
            onClick={() => openDrawer('score')}
            className="absolute top-2.5 right-2.5 cursor-pointer text-fg-disabled hover:text-fg-muted"
          >
            <Info size={12} />
          </button>
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

        <div
          className="h-full opacity-0"
          style={{ animation: 'card-enter 400ms cubic-bezier(0.22, 1, 0.36, 1) 175ms forwards' }}
        >
          {data.streak >= 7 ? (
            <ElectricBorder color="var(--color-accent)" speed={0.3} chaos={0.07} borderRadius={1}>
              <StreakCard data={data} dayLabels={dayLabels} electric onInfoClick={() => openDrawer('streak')} />
            </ElectricBorder>
          ) : (
            <StreakCard data={data} dayLabels={dayLabels} onInfoClick={() => openDrawer('streak')} />
          )}
        </div>

        <div
          className="relative flex flex-col justify-between rounded-md border border-border-subtle bg-surface px-3 py-4 opacity-0"
          style={{ animation: 'card-enter 400ms cubic-bezier(0.22, 1, 0.36, 1) 250ms forwards' }}
        >
          <button
            onClick={() => openDrawer('activity')}
            className="absolute top-2.5 right-2.5 cursor-pointer text-fg-disabled hover:text-fg-muted"
          >
            <Info size={12} />
          </button>
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

      <Sheet open={activeCard !== null} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent side="right" className="overflow-y-auto border-border bg-surface">
          <FocusScoreDrawer
            activeCard={activeCard}
            data={data}
            tier={tier}
            label={label}
            delta={delta}
            streakPts={streakPts}
            comparisonPts={comparisonPts}
            consistencyPts={consistencyPts}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
