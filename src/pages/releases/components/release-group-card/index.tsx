import { Star, BellRing, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReleaseRow } from '../release-row';
import type { ReleaseGroupCardProps } from './types';

export function ReleaseGroupCard(props: ReleaseGroupCardProps) {
  const { group, onToggleFavorite, onToggleNotification, onSelectRelease } = props;

  const BellIcon = group.isNotifyEnabled ? BellRing : BellOff;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <button
          onClick={() => onToggleFavorite(group.definitionId)}
          className="cursor-pointer text-fg-disabled transition-colors hover:text-fg"
        >
          <Star size={12} className={group.isFavorite ? 'fill-current text-fg' : ''} />
        </button>
        <button
          onClick={() => onToggleNotification(group.definitionId)}
          className={cn(
            'cursor-pointer transition-colors',
            group.isNotifyEnabled ? 'text-accent' : 'text-fg-disabled hover:text-fg',
          )}
        >
          <BellIcon size={12} />
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">
          {group.definitionName}
        </span>
        <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">
          {group.releases.length}
        </span>
      </div>

      {group.releases.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 py-4">
          <span className="text-[11px] text-fg-disabled">No releases yet</span>
        </div>
      ) : (
        <>
          <div className="mb-1 flex items-center gap-3 px-3">
            <span className="w-32 shrink-0 text-[10px] text-fg-disabled">Release</span>
            <span className="w-36 shrink-0 text-[10px] text-fg-disabled">Created by</span>
            <span className="flex-1 text-[10px] text-fg-disabled">Environments</span>
            <span className="w-16 shrink-0 text-right text-[10px] text-fg-disabled">Time</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {group.releases.map((release, idx) => (
              <div
                key={release.id}
                className={idx !== group.releases.length - 1 ? 'border-b border-border' : ''}
              >
                <ReleaseRow
                  release={release}
                  environmentNames={group.environmentNames}
                  onClick={() => onSelectRelease(release)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
