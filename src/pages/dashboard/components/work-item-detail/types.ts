export interface WorkItemDetailDialogProps {
  itemId: number | null;
  project: string;
  onClose: () => void;
  onNavigate?: (id: number) => void;
}

export type PriorityLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';

export type DisplayRelatedItem = {
  id: number;
  title: string;
  workItemType: string;
  state: string;
};

export type DisplayDetail = {
  title: string;
  type: string;
  state: string;
  assignee: string;
  iterationPath: string;
  description: string;
  createdDate: string;
  changedDate: string;
  createdBy: string;
  tags: string[];
  priority: PriorityLabel;
  webUrl: string;
  effort: string | null;
  estimateDays: string | null;
  completedWork: string | null;
  remainingWork: string | null;
  dueDate: string | null;
  devStartDate: string | null;
  devEndDate: string | null;
  blocked: string;
  parent: DisplayRelatedItem | null;
  children: DisplayRelatedItem[];
};

export interface RelatedItemsProps {
  parent: DisplayRelatedItem | null;
  children: DisplayRelatedItem[];
  onSelect: (id: number) => void;
}
