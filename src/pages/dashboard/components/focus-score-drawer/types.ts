import type { FocusScoreData, ScoreTier, ActiveCard } from '../focus-score/types';

export interface FocusScoreDrawerProps {
  activeCard: ActiveCard;
  data: FocusScoreData;
  tier: ScoreTier;
  label: string;
  delta: number;
  streakPts: number;
  comparisonPts: number;
  consistencyPts: number;
}
