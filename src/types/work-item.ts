export type WorkItemType = "task" | "bug" | "pbi" | "epic" | "feature";
export type WorkItemStatus = "todo" | "in-progress" | "in-review" | "done";

export interface WorkItemTheme {
  icon: React.ElementType;
  className: string;
  color: string;
  shineColors: string[];
}
