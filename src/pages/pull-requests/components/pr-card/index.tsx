import { GitPullRequest, GitBranch, CircleCheck, CircleX, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewerDot } from '../reviewer-dot';
import type { PRCardProps } from './types';

export function PRCard(props: PRCardProps) {
  const { pr, onOpen, onApprove, onReject, isReviewing } = props;
  const approved = pr.reviewers.filter((r) => r.vote === 'approved').length;
  const rejected = pr.reviewers.filter((r) => r.vote === 'rejected').length;
  const reqApproved = pr.reviewers.filter((r) => r.isRequired && r.vote === 'approved').length;
  const reqTotal = pr.reviewers.filter((r) => r.isRequired).length;

  const allRequiredApproved = reqTotal > 0 && reqApproved === reqTotal;
  const hasRejection = rejected > 0;

  return (
    <div className="group flex w-full flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-elevated">
      <div className="flex items-start gap-2.5">
        <GitPullRequest
          size={14}
          className={cn('mt-0.5 shrink-0', pr.status === 'draft' ? 'text-fg-disabled' : 'text-accent')}
        />
        <div className="flex-1 min-w-0">
          <button
            onClick={onOpen}
            className="block w-full truncate cursor-pointer text-left text-[13px] font-medium text-fg-secondary hover:text-fg hover:underline"
          >
            {pr.title}
          </button>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-disabled">
            <span>
              {pr.repo} · #{pr.id}
            </span>
            {pr.status === 'draft' && (
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px]">Draft</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onApprove}
            disabled={isReviewing}
            className="flex h-6 cursor-pointer items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 text-[11px] font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-50"
          >
            <CircleCheck size={12} />
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={isReviewing}
            className="flex h-6 cursor-pointer items-center gap-1 rounded-md border border-error/30 bg-error/10 px-2 text-[11px] font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
          >
            <CircleX size={12} />
            Reject
          </button>
          <button
            onClick={onOpen}
            title="Open in Azure DevOps"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-fg-disabled">
        <GitBranch size={10} className="shrink-0" />
        <span className="truncate font-mono">{pr.sourceBranch}</span>
        <span className="shrink-0">→</span>
        <span className="truncate font-mono">{pr.targetBranch}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[8px] font-semibold text-fg-muted">
            {pr.authorInitials}
          </span>
          <span className="text-[11px] text-fg-disabled">{pr.author}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pr.reviewers.length > 0 && (
            <div className="flex items-center gap-1">
              {pr.reviewers.slice(0, 5).map((r, i) => (
                <ReviewerDot key={i} reviewer={r} />
              ))}
              {pr.reviewers.length > 5 && (
                <span className="ml-1 text-[10px] text-fg-disabled">+{pr.reviewers.length - 5}</span>
              )}
            </div>
          )}

          <span
            className={cn(
              'shrink-0 rounded border px-1.5 py-0.5 text-[10px]',
              hasRejection
                ? 'border-error/40 bg-error/10 text-error'
                : allRequiredApproved
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border bg-elevated text-fg-disabled',
            )}
          >
            {hasRejection ? `${rejected} rejected` : `${approved}/${pr.reviewers.length} approved`}
          </span>

          <span className="shrink-0 text-[11px] text-fg-disabled">{pr.createdAgo}</span>
        </div>
      </div>
    </div>
  );
}
