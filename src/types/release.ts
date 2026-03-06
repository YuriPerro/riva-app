export type ReleaseEnvironmentStatus =
  | 'notStarted'
  | 'inProgress'
  | 'succeeded'
  | 'rejected'
  | 'failed'
  | 'cancelled'
  | 'partiallySucceeded';

export type EnvStatusStyle = {
  dot: string;
  ring: string;
  text: string;
  line: string;
};

export type ReleaseApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'reassigned'
  | 'skipped'
  | 'canceled';
