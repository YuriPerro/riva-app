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
};

export interface DetailFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClassName?: string;
}
