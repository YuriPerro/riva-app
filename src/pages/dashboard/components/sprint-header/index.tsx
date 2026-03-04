import { cn } from "@/lib/utils";
import type { SprintInfo } from "../../types";

const statusConfig = {
  "on-track":  { label: "On Track",  badgeClass: "bg-success/15 text-success border-success/20" },
  "at-risk":   { label: "At Risk",   badgeClass: "bg-warning/15 text-warning border-warning/20" },
  "off-track": { label: "Off Track", badgeClass: "bg-error/15 text-error border-error/20" },
};

interface SprintHeaderProps {
  sprint: SprintInfo;
}

export function SprintHeader(props: SprintHeaderProps) {
  const { sprint } = props;
  const status = statusConfig[sprint.status];

  return (
    <div className="flex items-center gap-2 text-[12px] text-fg-muted">
      <span className="text-fg-secondary">{sprint.name}</span>
      <span>·</span>
      <span>{sprint.daysRemaining} days remaining</span>
      <span>·</span>
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", status.badgeClass)}>
        {status.label}
      </span>
    </div>
  );
}
