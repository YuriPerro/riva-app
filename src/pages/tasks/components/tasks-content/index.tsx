import { useTranslation } from 'react-i18next';
import { AlertCircle, Layers } from 'lucide-react';
import { GroupedItems } from '../grouped-items';
import { KanbanBoard } from '../kanban-board';
import type { TasksContentProps } from './types';

export function TasksContent(props: TasksContentProps) {
  const { error, filtered, kanbanItems, viewMode, selectWorkItem, openItem, orderedStates, moveItemToState } = props;
  const { t } = useTranslation('tasks');

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-error">
        <AlertCircle size={14} />
        {error}
      </div>
    );
  }

  const displayItems = viewMode === 'kanban' ? kanbanItems : filtered;

  if (displayItems.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Layers size={24} className="text-fg-disabled" />
        <span className="text-[13px] text-fg-disabled">{t('noResults')}</span>
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <KanbanBoard
        items={kanbanItems}
        orderedStates={orderedStates}
        onSelect={selectWorkItem}
        openItem={openItem}
        onMoveItem={moveItemToState}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <GroupedItems items={filtered} onSelect={selectWorkItem} openItem={openItem} />
    </div>
  );
}
