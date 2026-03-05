import { AlertCircle, CheckSquare, Bug, Layers, Zap, Box, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterPill } from "@/components/ui/filter-pill";
import {
  useMyWork,
  type MyWorkItem,
  type WorkItemStatus,
  type WorkItemType,
  type StatusFilter,
  type TypeFilter,
} from "./use-my-work";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",         label: "All"         },
  { value: "todo",        label: "To Do"       },
  { value: "in-progress", label: "In Progress" },
  { value: "in-review",   label: "In Review"   },
  { value: "done",        label: "Done"        },
];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "task",    label: "Task"    },
  { value: "bug",     label: "Bug"     },
  { value: "pbi",     label: "PBI"     },
  { value: "feature", label: "Feature" },
  { value: "epic",    label: "Epic"    },
];

const TYPE_ICON: Record<WorkItemType, React.ElementType> = {
  task:    CheckSquare,
  bug:     Bug,
  pbi:     Layers,
  feature: Box,
  epic:    Zap,
};

const STATUS_COLOR: Record<WorkItemStatus, string> = {
  "todo":        "text-fg-disabled",
  "in-progress": "text-info",
  "in-review":   "text-warning",
  "done":        "text-success",
};

const STATUS_DOT: Record<WorkItemStatus, string> = {
  "todo":        "bg-fg-disabled",
  "in-progress": "bg-info",
  "in-review":   "bg-warning",
  "done":        "bg-success",
};

const STATUS_LABEL: Record<WorkItemStatus, string> = {
  "todo":        "To Do",
  "in-progress": "In Progress",
  "in-review":   "In Review",
  "done":        "Done",
};

// ─── Grouped items ────────────────────────────────────────────────────────────

function GroupedItems({
  items,
  openItem,
}: {
  items: MyWorkItem[];
  openItem: (url: string) => void;
}) {
  const groups = new Map<string, MyWorkItem[]>();
  for (const item of items) {
    const key = item.iterationPath ?? "No Sprint";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  // Sprint groups before "No Sprint"
  const sorted = [...groups.entries()].sort(([a], [b]) => {
    if (a === "No Sprint") return 1;
    if (b === "No Sprint") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-4 pb-2">
      {sorted.map(([group, groupItems]) => {
        const displayGroup = group.split("\\").pop() ?? group;

        return (
          <div key={group}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">
                {displayGroup}
              </span>
              <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">
                {groupItems.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {groupItems.map((item, idx) => {
                const Icon = TYPE_ICON[item.type];

                return (
                  <button
                    key={item.id}
                    onClick={() => openItem(item.url)}
                    className={cn(
                      "group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-elevated",
                      idx !== groupItems.length - 1 && "border-b border-border"
                    )}
                  >
                    <Icon size={13} className={cn("flex-shrink-0", STATUS_COLOR[item.status])} />

                    <span className="flex-1 truncate text-[13px] text-fg-secondary group-hover:text-fg">
                      {item.title}
                    </span>

                    <div className="flex flex-shrink-0 items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[item.status])} />
                        <span className={cn("text-[11px]", STATUS_COLOR[item.status])}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>

                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-fg-disabled">
                        {item.rawType}
                      </span>

                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[9px] font-medium text-fg-muted">
                        {item.assigneeInitials}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MyWorkPage() {
  const {
    filtered,
    items,
    isLoading,
    error,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    openItem,
  } = useMyWork();

  const countByStatus = (s: StatusFilter) =>
    s === "all" ? items.length : items.filter((i) => i.status === s).length;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-[18px] font-bold text-fg">My Work</h2>
        <span className="text-[12px] text-fg-disabled">·</span>
        <p className="text-[12px] text-fg-muted">
          {isLoading
            ? "Loading…"
            : `${items.length} item${items.length !== 1 ? "s" : ""} assigned to you`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Status pills */}
        {STATUS_FILTERS.map(({ value, label }) => (
          <FilterPill
            key={value}
            active={statusFilter === value}
            onClick={() => setStatusFilter(value)}
          >
            {label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]",
                statusFilter === value
                  ? "bg-accent/20 text-accent"
                  : "bg-elevated text-fg-disabled"
              )}
            >
              {countByStatus(value)}
            </span>
          </FilterPill>
        ))}

        {/* Divider */}
        <span className="mx-1 h-4 w-px bg-border" />

        {/* Type pills */}
        {TYPE_FILTERS.map(({ value, label }) => (
          <FilterPill
            key={value}
            active={typeFilter === value}
            onClick={() => setTypeFilter(typeFilter === value ? "all" : (value as TypeFilter))}
          >
            {label}
          </FilterPill>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={16} className="animate-spin text-fg-disabled" />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-error">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Layers size={24} className="text-fg-disabled" />
          <span className="text-[13px] text-fg-disabled">No items match the selected filters</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <GroupedItems items={filtered} openItem={openItem} />
        </div>
      )}
    </div>
  );
}
