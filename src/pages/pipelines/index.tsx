import { AlertCircle, CheckCircle2, XCircle, Loader2, MinusCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePipelines,
  type PipelineRunItem,
  type PipelineStatus,
  type StatusFilter,
} from "./use-pipelines";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "All"       },
  { value: "running",   label: "Running"   },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed",    label: "Failed"    },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_CONFIG: Record<PipelineStatus, {
  icon: React.ElementType;
  className: string;
  spin?: boolean;
  dot: string;
}> = {
  running:   { icon: Loader2,      className: "text-info",     spin: true, dot: "bg-info"     },
  succeeded: { icon: CheckCircle2, className: "text-success",              dot: "bg-success"  },
  failed:    { icon: XCircle,      className: "text-error",                dot: "bg-error"    },
  cancelled: { icon: MinusCircle,  className: "text-fg-muted",             dot: "bg-fg-muted" },
};

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-fg-secondary hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}

// ─── Run row ─────────────────────────────────────────────────────────────────

function RunRow({ run, onClick }: { run: PipelineRunItem; onClick: () => void }) {
  const { icon: Icon, className, spin, dot } = STATUS_CONFIG[run.status];

  return (
    <button
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-elevated"
    >
      {/* Status icon */}
      <Icon
        size={13}
        className={cn("flex-shrink-0", className, spin && "animate-spin")}
      />

      {/* Build number */}
      <span className="w-16 flex-shrink-0 font-mono text-[11px] text-fg-disabled">
        #{run.buildNumber}
      </span>

      {/* Branch */}
      <span className="flex-1 truncate font-mono text-[12px] text-fg-secondary group-hover:text-fg">
        {run.branch}
      </span>

      {/* Status pill */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        <span className={cn("text-[11px]", className)}>
          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
        </span>
      </div>

      {/* Duration */}
      <span className="w-14 flex-shrink-0 text-right text-[11px] text-fg-disabled">
        {run.duration}
      </span>

      {/* Ago */}
      <span className="w-16 flex-shrink-0 text-right text-[11px] text-fg-disabled">
        {run.ago}
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PipelinesPage() {
  const {
    runs,
    filtered,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    openRun,
  } = usePipelines();

  const countByStatus = (s: StatusFilter) =>
    s === "all" ? runs.length : runs.filter((r) => r.status === s).length;

  // Group by pipeline definition name
  const groups = new Map<string, PipelineRunItem[]>();
  for (const run of filtered) {
    if (!groups.has(run.definitionName)) groups.set(run.definitionName, []);
    groups.get(run.definitionName)!.push(run);
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-semibold text-fg">Pipelines</h2>
        <p className="mt-0.5 text-[12px] text-fg-muted">
          {isLoading
            ? "Loading…"
            : `${runs.length} recent run${runs.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
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
          <Zap size={24} className="text-fg-disabled" />
          <span className="text-[13px] text-fg-disabled">No pipeline runs found</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 pb-2">
            {[...groups.entries()].map(([name, groupRuns]) => (
              <div key={name}>
                {/* Pipeline header */}
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">
                    {name}
                  </span>
                  <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">
                    {groupRuns.length}
                  </span>
                </div>

                {/* Column headers */}
                <div className="mb-1 flex items-center gap-3 px-3">
                  <span className="w-[13px] flex-shrink-0" />
                  <span className="w-16 flex-shrink-0 text-[10px] text-fg-disabled">Build</span>
                  <span className="flex-1 text-[10px] text-fg-disabled">Branch</span>
                  <span className="w-24 flex-shrink-0 text-[10px] text-fg-disabled">Status</span>
                  <span className="w-14 flex-shrink-0 text-right text-[10px] text-fg-disabled">Duration</span>
                  <span className="w-16 flex-shrink-0 text-right text-[10px] text-fg-disabled">Time</span>
                </div>

                {/* Runs */}
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                  {groupRuns.map((run, idx) => (
                    <div
                      key={run.id}
                      className={idx !== groupRuns.length - 1 ? "border-b border-border" : ""}
                    >
                      <RunRow run={run} onClick={() => openRun(run.url)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
