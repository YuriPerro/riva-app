import type { StandupData } from '@/types/azure';
import type { TransitionGroup } from '../standup-transition-group/types';

export interface StandupContentProps {
  isLoading: boolean;
  isEmpty: boolean;
  standup: StandupData | null;
  yesterdayGroups: TransitionGroup[];
  todayGroups: TransitionGroup[];
  hasTodayContent: boolean;
}
