import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { BreakdownRow } from '../breakdown-row';
import type { ScoreSectionProps } from './types';

const TIER_THRESHOLDS: Record<string, string> = {
  success: '70-100',
  warning: '40-69',
  error: '0-39',
};

export function ScoreSection(props: ScoreSectionProps) {
  const { data, tier, label, streakPts, comparisonPts, consistencyPts } = props;

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="text-base">Score Breakdown</SheetTitle>
        <SheetDescription>How your focus score of {data.score}/100 is calculated</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">Formula</div>
          <div className="text-[13px] text-fg">streakPts + comparisonPts + consistencyPts</div>
        </div>

        <div className="flex flex-col gap-2">
          <BreakdownRow label="Streak Points" value={streakPts} max={40} description={`min(40, streak × 4) = min(40, ${data.streak} × 4)`} />
          <BreakdownRow label="Comparison Points" value={comparisonPts} max={30} description={`min(30, (thisWeek / lastWeek) × 30) = min(30, (${data.thisWeekItems} / ${Math.max(data.lastWeekItems, 1)}) × 30)`} />
          <BreakdownRow label="Consistency Points" value={consistencyPts} max={30} description={`min(30, activeDays × 6) = min(30, ${data.weekDays.filter(Boolean).length} × 6)`} />
        </div>

        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">Thresholds</div>
          <div className="flex flex-col gap-1.5 text-[12px]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className={`text-fg ${tier === 'success' ? 'font-medium' : ''}`}>Great focus: {TIER_THRESHOLDS.success} {tier === 'success' && `(${label})`}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className={`text-fg ${tier === 'warning' ? 'font-medium' : ''}`}>Keep going: {TIER_THRESHOLDS.warning} {tier === 'warning' && `(${label})`}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-error" />
              <span className={`text-fg ${tier === 'error' ? 'font-medium' : ''}`}>Needs attention: {TIER_THRESHOLDS.error} {tier === 'error' && `(${label})`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
