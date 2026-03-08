import type { DisplayRelatedItem } from '../work-item-detail/types';

export interface RelatedRowProps {
  item: DisplayRelatedItem;
  onSelect: (id: number) => void;
}
