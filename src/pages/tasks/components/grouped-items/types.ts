import type { TaskItem } from '../../use-tasks';

export interface GroupedItemsProps {
  items: TaskItem[];
  onSelect: (id: number) => void;
  openItem: (url: string) => void;
}
