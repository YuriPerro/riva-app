import type { KanbanBoardItem } from '../../use-tasks';

export interface KanbanColumnProps {
  rawState: string;
  color: string;
  items: KanbanBoardItem[];
  onSelect: (id: number) => void;
  openItem: (url: string) => void;
  disabled?: boolean;
}
