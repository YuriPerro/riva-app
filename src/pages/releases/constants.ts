import type { ReleaseEnvironmentStatus, EnvStatusStyle } from '@/types/release';

export const ENV_STATUS_STYLES: Record<ReleaseEnvironmentStatus, EnvStatusStyle> = {
  succeeded: { dot: 'bg-success', ring: 'ring-success/25', text: 'text-success', line: 'bg-success/30' },
  inProgress: { dot: 'bg-running', ring: 'ring-running/25', text: 'text-running', line: 'bg-running/30' },
  rejected: { dot: 'bg-error', ring: 'ring-error/25', text: 'text-error', line: 'bg-error/30' },
  failed: { dot: 'bg-error', ring: 'ring-error/25', text: 'text-error', line: 'bg-error/30' },
  cancelled: { dot: 'bg-error', ring: 'ring-error/25', text: 'text-error', line: 'bg-error/30' },
  partiallySucceeded: { dot: 'bg-warning', ring: 'ring-warning/25', text: 'text-warning', line: 'bg-warning/30' },
  notStarted: { dot: 'bg-fg-disabled', ring: '', text: 'text-fg-disabled', line: 'bg-border' },
};

export const STATUS_LABELS: Record<ReleaseEnvironmentStatus, string> = {
  succeeded: 'Succeeded',
  inProgress: 'In Progress',
  rejected: 'Rejected',
  failed: 'Failed',
  cancelled: 'Cancelled',
  partiallySucceeded: 'Partially Succeeded',
  notStarted: 'Not Started',
};
