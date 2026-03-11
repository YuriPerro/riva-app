import type { KanbanBoardItem } from '../../use-tasks';

export interface KanbanBoardProps {
  items: KanbanBoardItem[];
  orderedStates: string[];
  onSelect: (id: number) => void;
  openItem: (url: string) => void;
  onMoveItem: (itemId: number, targetState: string) => void;
}
