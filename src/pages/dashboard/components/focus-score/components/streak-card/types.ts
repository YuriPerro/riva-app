import type { FocusScoreData } from '../../types';

export interface StreakCardProps {
  data: FocusScoreData;
  dayLabels: string[];
  electric?: boolean;
  onInfoClick: () => void;
}
