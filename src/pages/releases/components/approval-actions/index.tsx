import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ApprovalActionsProps } from './types';

export function ApprovalActions(props: ApprovalActionsProps) {
  const { approvals, currentUserUniqueName } = props;
  const { t } = useTranslation('dashboard');

  if (approvals.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {approvals.map((approval) => {
        const isApproved = approval.status === 'approved';
        const isRejected = approval.status === 'rejected';
        const isPending = approval.status === 'pending';
        const isMe = currentUserUniqueName !== null && approval.approverUniqueName === currentUserUniqueName;

        return (
          <span
            key={approval.id}
            className={cn(
              'text-[10px]',
              isPending && isMe ? 'text-warning' : 'text-fg-disabled',
            )}
          >
            {isApproved && t('approvals.approvedBy', { name: approval.approverName })}
            {isRejected && t('approvals.rejectedBy', { name: approval.approverName })}
            {isPending && (isMe ? t('approvals.waitingForYourApproval') : t('approvals.pending', { name: approval.approverName }))}
          </span>
        );
      })}
    </div>
  );
}
