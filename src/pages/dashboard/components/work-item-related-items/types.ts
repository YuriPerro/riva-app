import type { DisplayRelatedItem } from '../work-item-detail/types';

export interface RelatedItemsProps {
  parent: DisplayRelatedItem | null;
  children: DisplayRelatedItem[];
  onSelect: (id: number) => void;
}
