import { ArrowRight, ExternalLink } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Route } from "@/types/routes";
import { getWorkItemTheme } from "@/utils/work-item-theme";
import type { WorkItemStatus } from "../../types";
import type { WorkItemsListProps } from "./types";

const statusConfig: Record<WorkItemStatus, { label: string; className: string }> = {
  "todo":        { label: "To Do",       className: "text-fg-disabled" },
  "in-progress": { label: "In Progress", className: "text-info" },
  "in-review":   { label: "In Review",   className: "text-warning" },
  "done":        { label: "Done",        className: "text-success" },
};

export function WorkItemsList(props: WorkItemsListProps) {
  const { items, onSelect } = props;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
          Tasks
        </span>
        <button
          onClick={() => navigate(Route.Tasks)}
          className="flex cursor-pointer items-center gap-1 text-[11px] text-fg-disabled transition-colors hover:text-fg-secondary"
        >
          View all <ArrowRight size={10} />
        </button>
      </div>

      <div className="flex flex-col max-h-[300px] overflow-y-auto">
        {items.map((item) => {
          const itemTheme = getWorkItemTheme(item.type);
          const Icon = itemTheme.icon;
          const status = statusConfig[item.status];

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors",
                "hover:bg-elevated cursor-pointer"
              )}
            >
              <Icon size={13} className={cn("shrink-0", itemTheme.className)} />

              <span className="flex-1 truncate text-[13px] text-fg-secondary group-hover:text-fg">
                {item.title}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-[11px]", status.className)}>
                  {status.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[9px] font-medium text-fg-muted">
                  {item.assigneeInitials}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openUrl(item.url);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-fg-disabled hover:text-fg-secondary transition-all"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
