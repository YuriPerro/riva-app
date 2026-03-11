import { useState, useCallback } from 'react';
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { KanbanBoardItem } from '../../use-tasks';

export function useKanbanBoard(
  items: KanbanBoardItem[],
  onMoveItem: (itemId: number, targetState: string) => void,
) {
  const [activeItem, setActiveItem] = useState<KanbanBoardItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = items.find((i) => i.id === event.active.id);
      setActiveItem(item ?? null);
    },
    [items],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;
      if (!over) return;

      const activeItemData = active.data.current?.item as KanbanBoardItem | undefined;
      if (!activeItemData) return;

      const targetState = over.data.current?.rawState as string | undefined;
      if (!targetState) return;

      const isSameColumn = activeItemData.rawState === targetState;
      if (isSameColumn) return;

      onMoveItem(activeItemData.id, targetState);
    },
    [onMoveItem],
  );

  return {
    sensors,
    activeItem,
    handleDragStart,
    handleDragEnd,
  };
}
