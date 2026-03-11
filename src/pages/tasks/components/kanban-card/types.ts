import type { KanbanBoardItem } from '../../use-tasks';

export interface KanbanCardProps {
  item: KanbanBoardItem;
  onSelect: (id: number) => void;
  openItem: (url: string) => void;
  isDragOverlay?: boolean;
}
