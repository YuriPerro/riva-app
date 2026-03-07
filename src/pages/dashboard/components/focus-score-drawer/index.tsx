import { ScoreSection } from '../score-section';
import { StreakSection } from '../streak-section';
import { ActivitySection } from '../activity-section';
import type { FocusScoreDrawerProps } from './types';

const SECTIONS = {
  score: ScoreSection,
  streak: StreakSection,
  activity: ActivitySection,
} as const;

export function FocusScoreDrawer(props: FocusScoreDrawerProps) {
  const { activeCard } = props;

  if (!activeCard) return null;

  const Section = SECTIONS[activeCard];
  return <Section {...props} />;
}
