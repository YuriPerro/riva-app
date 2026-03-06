import type { ReleaseItem } from '../../types';

export interface ReleaseRowProps {
  release: ReleaseItem;
  environmentNames: string[];
  onClick: () => void;
}
