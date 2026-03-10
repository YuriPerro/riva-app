import type { PipelineRun } from '@/types/azure';
import type { WorkItemType } from '@/types/work-item';
import type { WorkItemStatus } from '@/types/work-item';
import type { PipelineStatus } from '@/types/pipeline';
import type { ReleaseEnvironmentStatus, ReleaseApprovalStatus } from '@/types/release';

export function mapWorkItemType(type: string): WorkItemType {
  const t = type.toLowerCase();
  if (t.includes('bug')) return 'bug';
  if (t.includes('epic')) return 'epic';
  if (t.includes('feature')) return 'feature';
  if (t.includes('pbi') || t.includes('product backlog')) return 'pbi';
  return 'task';
}

export function mapWorkItemStatus(state: string): WorkItemStatus {
  const s = state.toLowerCase();

  const isInProgress = s.includes('progress') || s.includes('active') || s.includes('doing') || s.includes('progresso') || s.includes('desenvolvimento');
  if (isInProgress) return 'in-progress';

  const isInReview = s.includes('review') || s.includes('testing') || s.includes('qa') || s.includes('deploy') || s.includes('revis') || s.includes('aguardando') || s.includes('homolog');
  if (isInReview) return 'in-review';

  const isDone = s.includes('done') || s.includes('closed') || s.includes('resolved') || s.includes('completed') || s.includes('removed') || s.includes('conclu') || s.includes('finalizado');
  if (isDone) return 'done';

  return 'todo';
}

type StatusI18nKey = 'status.todo' | 'status.inProgress' | 'status.inReview' | 'status.done';
type TypeI18nKey = 'workItemTypes.task' | 'workItemTypes.bug' | 'workItemTypes.pbi' | 'workItemTypes.feature' | 'workItemTypes.epic';

const STATUS_I18N_KEY: Record<WorkItemStatus, StatusI18nKey> = {
  todo: 'status.todo',
  'in-progress': 'status.inProgress',
  'in-review': 'status.inReview',
  done: 'status.done',
};

const TYPE_I18N_KEY: Record<WorkItemType, TypeI18nKey> = {
  task: 'workItemTypes.task',
  bug: 'workItemTypes.bug',
  pbi: 'workItemTypes.pbi',
  feature: 'workItemTypes.feature',
  epic: 'workItemTypes.epic',
};

export function getStateI18nKey(rawState: string): StatusI18nKey {
  return STATUS_I18N_KEY[mapWorkItemStatus(rawState)];
}

export function getRawTypeI18nKey(rawType: string): TypeI18nKey {
  return TYPE_I18N_KEY[mapWorkItemType(rawType)];
}

export function mapPipelineStatus(run: PipelineRun): PipelineStatus {
  if (run.status === 'inProgress') return 'running';
  if (run.status === 'cancelling' || run.result === 'canceled') return 'cancelled';
  if (run.result === 'failed') return 'failed';
  if (run.result === 'succeeded') return 'succeeded';
  return 'cancelled';
}

const RELEASE_ENV_STATUS_MAP: Record<string, ReleaseEnvironmentStatus> = {
  succeeded: 'succeeded',
  inprogress: 'inProgress',
  rejected: 'rejected',
  failed: 'failed',
  canceled: 'cancelled',
  cancelled: 'cancelled',
  partiallysucceeded: 'partiallySucceeded',
  notstarted: 'notStarted',
  queued: 'inProgress',
  scheduled: 'notStarted',
  undefined: 'notStarted',
};

export function mapReleaseEnvironmentStatus(status: string): ReleaseEnvironmentStatus {
  return RELEASE_ENV_STATUS_MAP[status.toLowerCase()] ?? 'notStarted';
}

const APPROVAL_STATUS_MAP: Record<string, ReleaseApprovalStatus> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  reassigned: 'reassigned',
  skipped: 'skipped',
  canceled: 'canceled',
};

export function mapApprovalStatus(status: string): ReleaseApprovalStatus {
  return APPROVAL_STATUS_MAP[status.toLowerCase()] ?? 'pending';
}
