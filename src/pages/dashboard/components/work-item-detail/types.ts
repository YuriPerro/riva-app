export interface WorkItemDetailDialogProps {
  itemId: number | null;
  project: string;
  onClose: () => void;
}

export type PriorityLabel = "Critical" | "High" | "Medium" | "Low" | "None";

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
  completedWork: string | null;
  remainingWork: string | null;
  dueDate: string | null;
  devStartDate: string | null;
  devEndDate: string | null;
  blocked: string;
};
