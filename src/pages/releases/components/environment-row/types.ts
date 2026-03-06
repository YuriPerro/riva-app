import type { ReleaseEnvironmentStatus } from '@/types/release';
import type { ReleaseApprovalItem } from '../../types';

export interface EnvironmentRowProps {
  name: string;
  status: ReleaseEnvironmentStatus;
  lastDeployedOn?: string;
  isLast: boolean;
  approvals: ReleaseApprovalItem[];
  currentUserUniqueName: string | null;
}
