import type { StandupTransition } from '@/types/azure';

export interface TransitionGroup {
  toState: string;
  isDone: boolean;
  items: StandupTransition[];
}

export interface TransitionGroupViewProps {
  group: TransitionGroup;
}
