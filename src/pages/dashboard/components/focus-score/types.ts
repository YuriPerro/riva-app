export type FocusScoreData = {
  score: number;
  streak: number;
  bestStreak: number;
  weekDays: boolean[];
  thisWeekItems: number;
  lastWeekItems: number;
};

export type ScoreTier = 'success' | 'warning' | 'error';

export type ActiveCard = 'score' | 'streak' | 'activity' | null;

export interface FocusScoreProps {
  data: FocusScoreData;
}
