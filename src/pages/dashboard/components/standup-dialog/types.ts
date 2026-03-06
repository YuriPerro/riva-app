import type { StandupData, StandupTransition } from '@/types/azure';

export interface StandupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standup: StandupData | null;
  isLoading: boolean;
  period: number;
  onPeriodChange: (days: number) => void;
}

export interface TransitionGroup {
  toState: string;
  isDone: boolean;
  items: StandupTransition[];
}

export interface PeriodSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

export interface StandupSectionProps {
  label: string;
  color: string;
  children: React.ReactNode;
  empty?: boolean;
}

export interface TransitionGroupViewProps {
  group: TransitionGroup;
}

export interface TypeIconProps {
  type: string;
  size?: number;
}

export interface StandupContentProps {
  isLoading: boolean;
  isEmpty: boolean;
  standup: StandupData | null;
  yesterdayGroups: TransitionGroup[];
  todayGroups: TransitionGroup[];
  hasTodayContent: boolean;
}
