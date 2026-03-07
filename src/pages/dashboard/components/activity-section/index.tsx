import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { ActivitySectionProps } from './types';

export function ActivitySection(props: ActivitySectionProps) {
  const { data, delta } = props;

  const maxItems = Math.max(data.thisWeekItems, data.lastWeekItems, 1);
  const thisWeekPct = (data.thisWeekItems / maxItems) * 100;
  const lastWeekPct = (data.lastWeekItems / maxItems) * 100;

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="text-base">Activity Breakdown</SheetTitle>
        <SheetDescription>
          {data.thisWeekItems} activities this week vs {data.lastWeekItems} last week
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">Activity Sources</div>
          <ul className="flex flex-col gap-1.5 text-[12px] text-fg">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              Work item state changes (task transitions, bug updates)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              Pull requests created or updated
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              Code pushes to repositories
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              PR approvals and reviews
            </li>
          </ul>
        </div>

        <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">Week Comparison</div>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-fg-muted">This Week</span>
                <span className="font-medium tabular-nums text-fg">{data.thisWeekItems}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${thisWeekPct}%` }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-fg-muted">Last Week</span>
                <span className="font-medium tabular-nums text-fg">{data.lastWeekItems}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-fg-muted transition-all duration-500" style={{ width: `${lastWeekPct}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-2.5 text-[12px]">
            <span className={delta >= 0 ? 'text-success' : 'text-error'}>
              {delta >= 0 ? '+' : ''}{delta}
            </span>
            <span className="text-fg-muted"> difference ({delta >= 0 ? 'improvement' : 'decrease'} from last week)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
