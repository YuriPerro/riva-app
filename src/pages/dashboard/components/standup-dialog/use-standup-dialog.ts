import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import isTodayPlugin from 'dayjs/plugin/isToday';
import type { StandupData, StandupTransition } from '@/types/azure';
import { mapWorkItemStatus } from '@/utils/mappers';
import type { TransitionGroup } from '../standup-transition-group/types';

dayjs.extend(isTodayPlugin);

function isToday(isoDate: string): boolean {
  return dayjs(isoDate).isToday();
}

function getPastLabel(): string {
  const today = dayjs().day();
  if (today === 1) return 'Last Friday';
  return 'Yesterday';
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
    lines.push(`**${getPastLabel()}**`);
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

export function useStandupDialog(standup: StandupData | null) {
  const [copied, setCopied] = useState(false);

  const isEmpty = !standup || !hasActivity(standup);

  const pastLabel = getPastLabel();

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

  const clipboardText = useMemo(() => {
    if (!standup) return '';
    return formatForClipboard(standup);
  }, [standup]);

  const handleCopy = useCallback(async () => {
    if (!clipboardText) return;
    await navigator.clipboard.writeText(clipboardText);
    setCopied(true);
    toast.success('Standup copied');
    setTimeout(() => setCopied(false), 2000);
  }, [clipboardText]);

  return {
    copied,
    isEmpty,
    pastLabel,
    yesterdayGroups,
    todayGroups,
    hasTodayContent,
    clipboardText,
    handleCopy,
  };
}
