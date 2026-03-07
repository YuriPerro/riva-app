import type { FocusScoreData, ScoreTier, ActiveCard } from '../../types';

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
