import type { FocusScoreData } from '../focus-score/types';

export interface StreakCardProps {
  data: FocusScoreData;
  dayLabels: string[];
  electric?: boolean;
  onInfoClick: () => void;
}
