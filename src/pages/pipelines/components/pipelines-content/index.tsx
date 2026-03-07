import { AlertCircle, Zap } from 'lucide-react';
import { PipelineGroupCard } from '../pipeline-group-card';
import type { PipelinesContentProps } from './types';

export function PipelinesContent(props: PipelinesContentProps) {
  const { error, groups, toggleFavorite, openRun } = props;

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
