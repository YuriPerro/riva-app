import { CheckSquare, Bug, Layers, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkItemStatus, WorkItemType } from "../../types";
import type { WorkItemsListProps } from "./types";

const typeIcon: Record<WorkItemType, React.ElementType> = {
  task: CheckSquare,
  bug:  Bug,
  pbi:  Layers,
  epic: Zap,
};

const statusConfig: Record<WorkItemStatus, { label: string; className: string }> = {
  "todo":        { label: "To Do",       className: "text-fg-disabled" },
  "in-progress": { label: "In Progress", className: "text-info" },
  "in-review":   { label: "In Review",   className: "text-warning" },
  "done":        { label: "Done",        className: "text-success" },
};

export function WorkItemsList(props: WorkItemsListProps) {
  const { items } = props;

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
          My Work Items
        </span>
        <button className="flex cursor-pointer items-center gap-1 text-[11px] text-fg-disabled transition-colors hover:text-fg-secondary">
          View all <ArrowRight size={10} />
        </button>
      </div>

      <div className="flex flex-col max-h-[340px] overflow-y-auto">
        {items.map((item) => {
          const Icon = typeIcon[item.type];
          const status = statusConfig[item.status];

          return (
            <div
              key={item.id}
              className={cn(
                "group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors",
                "hover:bg-elevated cursor-pointer"
              )}
            >
              <Icon size={13} className={cn("flex-shrink-0", status.className)} />

              <span className="flex-1 truncate text-[13px] text-fg-secondary group-hover:text-fg">
                {item.title}
              </span>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn("text-[11px]", status.className)}>
                  {status.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[9px] font-medium text-fg-muted">
                  {item.assigneeInitials}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
