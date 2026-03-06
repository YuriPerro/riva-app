import type { ReleaseGroup, ReleaseItem } from '../../types';

export interface ReleaseGroupCardProps {
  group: ReleaseGroup;
  onToggleFavorite: (definitionId: number) => void;
  onSelectRelease: (release: ReleaseItem) => void;
}
