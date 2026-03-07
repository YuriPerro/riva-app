import { ScoreSection } from './components/score-section';
import { StreakSection } from './components/streak-section';
import { ActivitySection } from './components/activity-section';
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
