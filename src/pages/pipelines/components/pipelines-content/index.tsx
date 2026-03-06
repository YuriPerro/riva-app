import { AlertCircle, Loader2, Zap } from 'lucide-react';
import { PipelineGroupCard } from '../pipeline-group-card';
import type { PipelinesContentProps } from './types';

export function PipelinesContent(props: PipelinesContentProps) {
  const { isLoading, error, groups, toggleFavorite, openRun } = props;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={16} className="animate-spin text-fg-disabled" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-error">
        <AlertCircle size={14} />
        {error}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Zap size={24} className="text-fg-disabled" />
        <span className="text-[13px] text-fg-disabled">No pipeline definitions found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-2">
        {groups.map((group) => (
          <PipelineGroupCard
            key={group.definitionId}
            group={group}
            onToggleFavorite={toggleFavorite}
            onOpenRun={openRun}
          />
        ))}
      </div>
    </div>
  );
}
