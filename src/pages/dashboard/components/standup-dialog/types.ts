import type { StandupData } from '@/types/azure';

export interface StandupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standup: StandupData | null;
  isLoading: boolean;
  period: number;
  onPeriodChange: (days: number) => void;
}
