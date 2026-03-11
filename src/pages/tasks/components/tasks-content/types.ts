import type { TasksViewMode } from '@/store/tasks-view';
import type { TaskItem, KanbanBoardItem } from '../../use-tasks';

export interface TasksContentProps {
  error: string | null;
  filtered: TaskItem[];
  kanbanItems: KanbanBoardItem[];
  viewMode: TasksViewMode;
  selectWorkItem: (id: number) => void;
  openItem: (url: string) => void;
  orderedStates: string[];
  moveItemToState: (itemId: number, targetState: string) => void;
}
