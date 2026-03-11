import { useMemo } from 'react';
import { DndContext, DragOverlay, rectIntersection } from '@dnd-kit/core';
import { mapWorkItemStatus } from '@/utils/mappers';
import type { WorkItemStatus } from '@/types/work-item';
import { KanbanColumn } from '../kanban-column';
import { KanbanCard } from '../kanban-card';
import { useKanbanBoard } from './use-kanban-board';
import type { KanbanBoardProps } from './types';
import type { KanbanBoardItem } from '../../use-tasks';

const STATUS_COLOR: Record<WorkItemStatus, string> = {
  todo: 'bg-fg-disabled',
  'in-progress': 'bg-info',
  'in-review': 'bg-warning',
  done: 'bg-success',
};

export type KanbanColumnData = {
  rawState: string;
  color: string;
  items: KanbanBoardItem[];
};

export function KanbanBoard(props: KanbanBoardProps) {
  const { items, orderedStates, onSelect, openItem, onMoveItem } = props;
  const { sensors, activeItem, handleDragStart, handleDragEnd } =
    useKanbanBoard(items, onMoveItem);

  const columns = useMemo(() => {
    const grouped = new Map<string, KanbanBoardItem[]>();
    for (const item of items) {
      if (!grouped.has(item.rawState)) grouped.set(item.rawState, []);
      grouped.get(item.rawState)!.push(item);
    }

    return orderedStates.map((rawState): KanbanColumnData => ({
      rawState,
      color: STATUS_COLOR[mapWorkItemStatus(rawState)],
      items: grouped.get(rawState) ?? [],
    }));
  }, [items, orderedStates]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden">
        {columns.map((column) => (
          <KanbanColumn
            key={column.rawState}
            rawState={column.rawState}
            color={column.color}
            items={column.items}
            onSelect={onSelect}
            openItem={openItem}
            disabled={activeItem?.rawState === column.rawState}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeItem && (
          <KanbanCard item={activeItem} onSelect={onSelect} openItem={openItem} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
