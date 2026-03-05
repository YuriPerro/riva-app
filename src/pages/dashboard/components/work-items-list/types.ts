import type { WorkItem } from "../../types";

export interface WorkItemsListProps {
  items: WorkItem[];
  onSelect: (id: number) => void;
}
