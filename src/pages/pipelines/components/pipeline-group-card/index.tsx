import { Star } from 'lucide-react';
import { RunRow } from '../run-row';
import type { PipelineGroupCardProps } from './types';

export function PipelineGroupCard(props: PipelineGroupCardProps) {
  const { group, onToggleFavorite, onOpenRun } = props;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <button
          onClick={() => onToggleFavorite(group.definitionId)}
          className="cursor-pointer text-fg-disabled transition-colors hover:text-fg"
        >
          <Star size={12} className={group.isFavorite ? 'fill-current text-fg' : ''} />
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">
          {group.definitionName}
        </span>
        <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">{group.runs.length}</span>
      </div>

      {group.runs.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-4">
          <span className="text-[11px] text-fg-disabled">No runs yet</span>
        </div>
      ) : (
        <>
          <div className="mb-1 flex items-center gap-3 px-3">
            <span className="w-[13px] shrink-0" />
            <span className="w-24 shrink-0 text-[10px] text-fg-disabled">Build</span>
            <span className="flex-1 text-[10px] text-fg-disabled">Branch</span>
            <span className="w-24 shrink-0 text-[10px] text-fg-disabled">Status</span>
            <span className="w-14 shrink-0 text-right text-[10px] text-fg-disabled">Duration</span>
            <span className="w-16 shrink-0 text-right text-[10px] text-fg-disabled">Time</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {group.runs.map((run, idx) => (
              <div key={run.id} className={idx !== group.runs.length - 1 ? 'border-b border-border' : ''}>
                <RunRow run={run} onClick={() => onOpenRun(run.url)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
