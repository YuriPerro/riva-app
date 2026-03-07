import { useQuery } from '@tanstack/react-query';
import { azure } from '@/lib/tauri';
import { useSessionStore } from '@/store/session';
import type { FocusScoreData, ScoreTier } from './types';

const STORAGE_KEY = 'forge_best_streak';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TIER_COLORS: Record<ScoreTier, string> = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

function getScoreTier(score: number): ScoreTier {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Great focus';
  if (score >= 60) return 'Good momentum';
  if (score >= 40) return 'Keep going';
  return 'Needs attention';
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;

  const dateSet = new Set(activeDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  let current = new Date(today);
  if (!dateSet.has(todayStr)) {
    current.setDate(current.getDate() - 1);
  }

  let streak = 0;
  while (dateSet.has(toDateString(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

function computeBestStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;

  const sorted = [...activeDates].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else if (diffDays > 1) {
      current = 1;
    }
  }
  return best;
}

function computeWeekDays(activeDates: string[]): boolean[] {
  const dateSet = new Set(activeDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = getMondayOfWeek(today);

  const days: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    days.push(dateSet.has(toDateString(d)));
  }
  return days;
}

function computeScore(streak: number, thisWeek: number, lastWeek: number, activeDaysThisWeek: number): number {
  const streakPts = Math.min(40, streak * 4);
  const comparisonPts = Math.min(30, (thisWeek / Math.max(lastWeek, 1)) * 30);
  const consistencyPts = Math.min(30, activeDaysThisWeek * 6);
  return Math.min(100, Math.round(streakPts + comparisonPts + consistencyPts));
}

function getStoredBestStreak(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function persistBestStreak(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {}
}

function buildFocusData(activeDates: string[], thisWeekCount: number, lastWeekCount: number): FocusScoreData {
  const streak = computeStreak(activeDates);
  const sessionBest = computeBestStreak(activeDates);
  const storedBest = getStoredBestStreak();
  const bestStreak = Math.max(streak, sessionBest, storedBest);
  persistBestStreak(bestStreak);

  const weekDays = computeWeekDays(activeDates);
  const activeDaysThisWeek = weekDays.filter(Boolean).length;
  const score = computeScore(streak, thisWeekCount, lastWeekCount, activeDaysThisWeek);

  return {
    score,
    streak,
    bestStreak,
    weekDays,
    thisWeekItems: thisWeekCount,
    lastWeekItems: lastWeekCount,
  };
}

export function useFocusScore() {
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['user-activity', project, team],
    queryFn: () => azure.getUserActivityDates(project!, team ?? undefined, 30),
    enabled: !!project,
    staleTime: 300_000,
  });

  const data: FocusScoreData = activityData
    ? buildFocusData(activityData.activeDates, activityData.thisWeekCount, activityData.lastWeekCount)
    : { score: 0, streak: 0, bestStreak: getStoredBestStreak(), weekDays: Array(7).fill(false), thisWeekItems: 0, lastWeekItems: 0 };

  const tier = getScoreTier(data.score);
  const label = getScoreLabel(data.score);
  const strokeColor = TIER_COLORS[tier];
  const delta = data.thisWeekItems - data.lastWeekItems;
  const maxItems = Math.max(data.thisWeekItems, data.lastWeekItems, 1);

  return {
    data,
    tier,
    label,
    strokeColor,
    delta,
    maxItems,
    dayLabels: DAY_LABELS,
    isLoading,
  };
}
