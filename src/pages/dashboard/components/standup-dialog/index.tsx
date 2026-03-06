import { useState, useCallback, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { StandupData, StandupTransition } from '@/types/azure';
import { mapWorkItemStatus } from '@/utils/mappers';
import { PeriodSelector } from './period-selector';
import { StandupContent } from './standup-content';
import type { StandupDialogProps, TransitionGroup } from './types';

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function groupTransitions(transitions: StandupTransition[]): TransitionGroup[] {
  const map = new Map<string, StandupTransition[]>();
  for (const t of transitions) {
    const existing = map.get(t.toState) ?? [];
    existing.push(t);
    map.set(t.toState, existing);
  }

  const groups: TransitionGroup[] = [];
  for (const [toState, items] of map) {
    groups.push({
      toState,
      isDone: mapWorkItemStatus(toState) === 'done',
      items,
    });
  }

  groups.sort((a, b) => {
    if (a.isDone && !b.isDone) return -1;
    if (!a.isDone && b.isDone) return 1;
    return b.items.length - a.items.length;
  });

  return groups;
}

function hasActivity(data: StandupData): boolean {
  const hasTransition = data.transitions.length > 0;
  const hasTodayData = data.today.length > 0;
  const hasTodayPRs = data.todayPrs.length > 0;
  const hasTodayBlockers = data.blockers.length > 0;

  return hasTransition || hasTodayData || hasTodayPRs || hasTodayBlockers;
}

function formatForClipboard(standup: StandupData): string {
  const lines: string[] = [];
  const past = standup.transitions.filter((t) => !isToday(t.changedDate));
  const todayTransitions = standup.transitions.filter((t) => isToday(t.changedDate));

  if (past.length > 0) {
    lines.push('**Yesterday**');
    for (const group of groupTransitions(past)) {
      const prefix = group.isDone ? '✓' : '→';
      lines.push(`${prefix} ${group.toState} (${group.items.length})`);
      for (const t of group.items) {
        lines.push(`  - #${t.workItemId} ${t.title}`);
      }
    }
    lines.push('');
  }

  lines.push('**Today**');
  const hasTodayContent = todayTransitions.length > 0 || standup.today.length > 0 || standup.todayPrs.length > 0;

  if (!hasTodayContent) lines.push('- (none)');

  if (todayTransitions.length > 0) {
    for (const group of groupTransitions(todayTransitions)) {
      const prefix = group.isDone ? '✓' : '→';
      lines.push(`${prefix} ${group.toState} (${group.items.length})`);
      for (const t of group.items) {
        lines.push(`  - #${t.workItemId} ${t.title}`);
      }
    }
  }

  if (standup.today.length > 0) {
    lines.push('Working on:');

    for (const item of standup.today) {
      lines.push(`  - #${item.id} ${item.title}`);
    }
  }

  for (const pr of standup.todayPrs) {
    const verb = pr.activityType === 'created' ? 'Created' : 'Reviewing';
    lines.push(`- ${verb} PR #${pr.id} ${pr.title} on ${pr.repo}`);
  }

  if (standup.blockers.length > 0) {
    lines.push('');
    lines.push('**Blockers**');

    for (const b of standup.blockers) lines.push(`- #${b.id} ${b.title}`);
  }

  return lines.join('\n');
}

export function StandupDialog(props: StandupDialogProps) {
  const { open, onOpenChange, standup, isLoading, period, onPeriodChange } = props;
  const [copied, setCopied] = useState(false);

  const isEmpty = !standup || !hasActivity(standup);

  const { yesterdayGroups, todayGroups } = useMemo(() => {
    if (!standup) return { yesterdayGroups: [], todayGroups: [] };
    const past = standup.transitions.filter((t) => !isToday(t.changedDate));
    const current = standup.transitions.filter((t) => isToday(t.changedDate));
    return {
      yesterdayGroups: groupTransitions(past),
      todayGroups: groupTransitions(current),
    };
  }, [standup]);

  const hasTodayContent =
    todayGroups.length > 0 || (standup?.today.length ?? 0) > 0 || (standup?.todayPrs.length ?? 0) > 0;

  const handleCopy = useCallback(async () => {
    if (!standup) return;
    await navigator.clipboard.writeText(formatForClipboard(standup));
    setCopied(true);
    toast.success('Standup copied');
    setTimeout(() => setCopied(false), 2000);
  }, [standup]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-[13px] font-semibold">Standup Summary</DialogTitle>
            <div className="flex items-center gap-2">
              <PeriodSelector value={period} onChange={onPeriodChange} />
              <button
                onClick={handleCopy}
                disabled={isEmpty || isLoading}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] text-fg-muted transition-colors hover:text-fg disabled:cursor-default disabled:opacity-40"
              >
                {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Summary of your recent work activity for standup meetings
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-1">
          <StandupContent
            isLoading={isLoading}
            isEmpty={isEmpty}
            standup={standup}
            yesterdayGroups={yesterdayGroups}
            todayGroups={todayGroups}
            hasTodayContent={hasTodayContent}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
