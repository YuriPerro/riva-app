import type { TaskItem } from '../../use-tasks';

export interface TasksContentProps {
  error: string | null;
  filtered: TaskItem[];
  selectWorkItem: (id: number) => void;
  openItem: (url: string) => void;
}
