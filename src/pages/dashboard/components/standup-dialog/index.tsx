import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, CheckCircle2, ArrowRight, Circle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { StandupData, StandupTransition } from '@/types/azure';
import type { StandupDialogProps } from './types';

const PERIODS = [
  { value: 1, label: 'Yesterday' },
  { value: 2, label: 'Last 2 days' },
  { value: 3, label: 'Last 3 days' },
];

const DONE_STATES = new Set(['done', 'closed', 'completed', 'resolved', 'removed']);

interface TransitionGroup {
  toState: string;
  isDone: boolean;
  items: StandupTransition[];
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
      isDone: DONE_STATES.has(toState.toLowerCase()),
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

function formatForClipboard(standup: StandupData): string {
  const lines: string[] = [];

  if (standup.transitions.length > 0) {
    lines.push('**Yesterday**');
    const groups = groupTransitions(standup.transitions);
    for (const group of groups) {
      const prefix = group.isDone ? '✓' : '→';
      lines.push(`${prefix} ${group.toState} (${group.items.length})`);
      for (const t of group.items) {
        lines.push(`  - #${t.workItemId} ${t.title}`);
      }
    }
    lines.push('');
  }

  lines.push('**Today**');
  if (standup.today.length === 0 && standup.todayPrs.length === 0) {
    lines.push('- (none)');
  }
  for (const item of standup.today) {
    lines.push(`- #${item.id} ${item.title} — ${item.state}`);
  }
  for (const pr of standup.todayPrs) {
    const verb = pr.activityType === 'created' ? 'Created' : 'Reviewing';
    lines.push(`- ${verb} PR #${pr.id} ${pr.title} on ${pr.repo}`);
  }

  if (standup.blockers.length > 0) {
    lines.push('');
    lines.push('**Blockers**');
    for (const b of standup.blockers) {
      lines.push(`- #${b.id} ${b.title}`);
    }
  }

  return lines.join('\n');
}

function PeriodSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PERIODS.find((p) => p.value === value) ?? PERIODS[0];

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] text-fg-muted transition-colors hover:text-fg"
      >
        {current.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[120px] rounded-md border border-border bg-overlay p-1 shadow-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
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

function Section({
  label,
  color,
  children,
  empty,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Circle size={6} className={cn('fill-current', color)} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">{label}</span>
      </div>
      {empty ? (
        <span className="pl-4 text-[12px] text-fg-disabled">No activity</span>
      ) : (
        <div className="flex flex-col gap-3 pl-4">{children}</div>
      )}
    </div>
  );
}

function TransitionGroupView({ group }: { group: TransitionGroup }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
        {group.isDone ? (
          <CheckCircle2 size={10} className="text-success" />
        ) : (
          <ArrowRight size={9} className="text-fg-disabled" />
        )}
        <span className={cn('font-medium', group.isDone && 'text-success')}>{group.toState}</span>
        <span className="text-fg-disabled">({group.items.length})</span>
      </div>
      <div className="flex flex-col gap-0.5 pl-4">
        {group.items.map((t) => (
          <div key={t.workItemId} className="flex items-center gap-1.5 text-[12px]">
            <span className="shrink-0 text-fg-disabled">#{t.workItemId}</span>
            <span className="truncate text-fg-secondary">{t.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StandupDialog({ open, onOpenChange, standup, isLoading, period, onPeriodChange }: StandupDialogProps) {
  const [copied, setCopied] = useState(false);

  const isEmpty =
    !standup ||
    (standup.transitions.length === 0 &&
      standup.today.length === 0 &&
      standup.todayPrs.length === 0 &&
      standup.blockers.length === 0);

  const transitionGroups = useMemo(() => (standup ? groupTransitions(standup.transitions) : []), [standup]);

  const handleCopy = useCallback(async () => {
    if (!standup) return;
    await navigator.clipboard.writeText(formatForClipboard(standup));
    setCopied(true);
    toast.success('Standup copied');
    setTimeout(() => setCopied(false), 2000);
  }, [standup]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col overflow-hidden">
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
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={14} className="animate-spin text-fg-disabled" />
            </div>
          ) : isEmpty ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-[12px] text-fg-disabled">No activity found for this period</span>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <Section label="Yesterday" color="text-info" empty={transitionGroups.length === 0}>
                {transitionGroups.map((group) => (
                  <TransitionGroupView key={group.toState} group={group} />
                ))}
              </Section>

              <Section
                label="Today"
                color="text-success"
                empty={standup!.today.length === 0 && standup!.todayPrs.length === 0}
              >
                {standup!.today.map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5 text-[12px]">
                    <span className="shrink-0 text-fg-disabled">#{item.id}</span>
                    <span className="truncate text-fg-secondary">{item.title}</span>
                    <span className="shrink-0 text-fg-disabled">— {item.state}</span>
                  </div>
                ))}
                {standup!.todayPrs.map((pr) => (
                  <div key={`pr-${pr.id}`} className="flex items-center gap-1.5 text-[12px]">
                    <span className="shrink-0 text-fg-disabled">PR #{pr.id}</span>
                    <span className="truncate text-fg-secondary">{pr.title}</span>
                    <span className="shrink-0 text-fg-disabled">· {pr.repo}</span>
                  </div>
                ))}
              </Section>

              {standup!.blockers.length > 0 && (
                <Section label="Blockers" color="text-error">
                  {standup!.blockers.map((b) => (
                    <div key={b.id} className="flex items-center gap-1.5 text-[12px]">
                      <span className="shrink-0 text-fg-disabled">#{b.id}</span>
                      <span className="truncate text-fg-secondary">{b.title}</span>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
