import type { SprintInfo } from '../../types';

export interface SprintHeaderProps {
  sprint: SprintInfo | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  goToPrevSprint: () => void;
  goToNextSprint: () => void;
  goToCurrentSprint: () => void;
  isCurrentSprint: boolean;
}
