import { GitBranch, Copy, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { buildBranchName } from '@/utils/formatters';
import { mapWorkItemType } from '@/utils/mappers';
import { useBranchField } from './use-branch-field';
import type { BranchFieldProps } from './types';

export function BranchField(props: BranchFieldProps) {
  const { id, type } = props;
  const { t } = useTranslation('dashboard');
  const branch = buildBranchName(id, mapWorkItemType(type));
  const { copied, handleCopy } = useBranchField(branch);
  const CopyIcon = copied ? CheckCheck : Copy;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
        <GitBranch size={11} />
        {t('workItemDetail.suggestedBranch')}
      </div>
      <button
        onClick={handleCopy}
        className="flex w-full cursor-pointer items-center gap-2 rounded-md bg-elevated px-3 py-2 text-left transition-colors hover:bg-border"
      >
        <code className="flex-1 truncate text-[12px] text-fg-secondary">{branch}</code>
        <CopyIcon size={12} className={cn('shrink-0', copied ? 'text-success' : 'text-fg-muted')} />
      </button>
    </div>
  );
}
