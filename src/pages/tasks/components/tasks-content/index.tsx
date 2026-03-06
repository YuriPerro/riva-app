import { AlertCircle, Layers, Loader2 } from 'lucide-react';
import { GroupedItems } from '../grouped-items';
import type { TasksContentProps } from './types';

export function TasksContent(props: TasksContentProps) {
  const { isLoading, error, filtered, selectWorkItem, openItem } = props;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={16} className="animate-spin text-fg-disabled" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-error">
        <AlertCircle size={14} />
        {error}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Layers size={24} className="text-fg-disabled" />
        <span className="text-[13px] text-fg-disabled">No items match the selected filters</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <GroupedItems items={filtered} onSelect={selectWorkItem} openItem={openItem} />
    </div>
  );
}
