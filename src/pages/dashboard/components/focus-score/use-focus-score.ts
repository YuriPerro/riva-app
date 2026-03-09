import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { azure } from '@/lib/tauri';
import { useSessionStore } from '@/store/session';
import type { FocusScoreData, ScoreTier, ActiveCard } from './types';

const STORAGE_KEY = 'riva_best_streak';
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

function getScoreLabelKey(score: number): string {
  if (score >= 80) return 'focusScore.greatFocus';
  if (score >= 60) return 'focusScore.goodMomentum';
  if (score >= 40) return 'focusScore.keepGoing';
  return 'focusScore.needsAttention';
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

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function prevWorkday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  while (isWeekend(d)) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function computeStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;

  const dateSet = new Set(activeDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  let current = new Date(today);
  if (isWeekend(current)) {
    current = prevWorkday(current);
  } else if (!dateSet.has(todayStr)) {
    current = prevWorkday(current);
  }

  let streak = 0;
  while (dateSet.has(toDateString(current))) {
    streak++;
    current = prevWorkday(current);
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

    const expected = prevWorkday(curr);
    expected.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);

    const isConsecutiveWorkday = prev.getTime() === expected.getTime();

    if (isConsecutiveWorkday) {
      current++;
      if (current > best) best = current;
    } else {
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

type ScoreBreakdown = {
  streakPts: number;
  comparisonPts: number;
  consistencyPts: number;
  total: number;
};

function computeScore(streak: number, thisWeek: number, lastWeek: number, activeDaysThisWeek: number): ScoreBreakdown {
  const streakPts = Math.min(40, streak * 4);
  const comparisonPts = Math.min(30, Math.round((thisWeek / Math.max(lastWeek, 1)) * 30));
  const consistencyPts = Math.min(30, activeDaysThisWeek * 6);
  const total = Math.min(100, Math.round(streakPts + comparisonPts + consistencyPts));
  return { streakPts, comparisonPts, consistencyPts, total };
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
  const { total: score } = computeScore(streak, thisWeekCount, lastWeekCount, activeDaysThisWeek);

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
  const { t } = useTranslation('dashboard');
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);
  const [activeCard, setActiveCard] = useState<ActiveCard>(null);

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
  const label = t(getScoreLabelKey(data.score) as 'focusScore.greatFocus');
  const strokeColor = TIER_COLORS[tier];
  const delta = data.thisWeekItems - data.lastWeekItems;
  const maxItems = Math.max(data.thisWeekItems, data.lastWeekItems, 1);
  const activeDaysThisWeek = data.weekDays.filter(Boolean).length;
  const { streakPts, comparisonPts, consistencyPts } = computeScore(data.streak, data.thisWeekItems, data.lastWeekItems, activeDaysThisWeek);

  const openDrawer = (card: ActiveCard) => setActiveCard(card);
  const closeDrawer = () => setActiveCard(null);

  return {
    data,
    tier,
    label,
    strokeColor,
    delta,
    maxItems,
    dayLabels: DAY_LABELS,
    isLoading,
    activeCard,
    openDrawer,
    closeDrawer,
    streakPts,
    comparisonPts,
    consistencyPts,
  };
}
