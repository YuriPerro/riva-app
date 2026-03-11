import type { TasksViewMode } from '@/store/tasks-view';

export interface ViewToggleProps {
  viewMode: TasksViewMode;
  onChange: (mode: TasksViewMode) => void;
}
