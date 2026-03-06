import type { PR } from "../../use-pull-requests";

export interface PRCardProps {
  pr: PR;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  isReviewing: boolean;
}
