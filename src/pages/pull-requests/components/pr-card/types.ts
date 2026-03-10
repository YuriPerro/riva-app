import type { PR } from '../../use-pull-requests';

export interface PRCardProps {
  pr: PR;
  currentUser: string | null;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onResetVote: () => void;
  isReviewing: boolean;
}
