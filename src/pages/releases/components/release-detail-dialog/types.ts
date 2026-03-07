import type { ReleaseApprovalItem, ReleaseItem } from '../../types';

export interface ReleaseDetailDialogProps {
  release: ReleaseItem | null;
  onClose: () => void;
  onApprove: (approvalId: number) => void;
  onReject: (approvalId: number) => void;
  isApproving: boolean;
  currentUserUniqueName: string | null;
  myPendingApproval: ReleaseApprovalItem | null;
}
