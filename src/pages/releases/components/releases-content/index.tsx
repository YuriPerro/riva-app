import { AlertCircle, Rocket } from 'lucide-react';
import { ReleaseGroupCard } from '../release-group-card';
import type { ReleasesContentProps } from './types';

export function ReleasesContent(props: ReleasesContentProps) {
  const { error, groups, toggleFavorite, selectRelease } = props;

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
        <Rocket size={24} className="text-fg-disabled" />
        <span className="text-[13px] text-fg-disabled">No release definitions found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-2">
        {groups.map((group) => (
          <ReleaseGroupCard
            key={group.definitionId}
            group={group}
            onToggleFavorite={toggleFavorite}
            onSelectRelease={selectRelease}
          />
        ))}
      </div>
    </div>
  );
}
