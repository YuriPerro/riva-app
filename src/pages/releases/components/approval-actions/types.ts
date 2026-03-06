import type { ReleaseApprovalItem } from '../../types';

export interface ApprovalActionsProps {
  approvals: ReleaseApprovalItem[];
  currentUserUniqueName: string | null;
}
