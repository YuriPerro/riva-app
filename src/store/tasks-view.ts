import { create } from 'zustand';

export type TasksViewMode = 'list' | 'kanban';

const STORAGE_KEY = 'riva_tasks_view_mode';

function getStoredViewMode(): TasksViewMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'kanban' ? 'kanban' : 'list';
}

interface TasksViewState {
  viewMode: TasksViewMode;
  setViewMode: (mode: TasksViewMode) => void;
}

export const useTasksViewStore = create<TasksViewState>((set) => ({
  viewMode: getStoredViewMode(),
  setViewMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ viewMode: mode });
  },
}));
