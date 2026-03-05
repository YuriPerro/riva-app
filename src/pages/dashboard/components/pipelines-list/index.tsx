import { CheckCircle2, XCircle, Loader2, MinusCircle, ArrowRight } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { PipelineStatus } from "../../types";
import type { PipelinesListProps } from "./types";

const statusConfig: Record<PipelineStatus, { icon: React.ElementType; className: string; spin?: boolean }> = {
  succeeded: { icon: CheckCircle2, className: "text-success" },
  failed:    { icon: XCircle,      className: "text-error" },
  running:   { icon: Loader2,      className: "text-running", spin: true },
  cancelled: { icon: MinusCircle,  className: "text-neutral" },
};

export function PipelinesList(props: PipelinesListProps) {
  const { pipelines } = props;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
          Pipelines
        </span>
        <button
          onClick={() => navigate("/pipelines")}
          className="flex cursor-pointer items-center gap-1 text-[11px] text-fg-disabled transition-colors hover:text-fg-secondary"
        >
          View all <ArrowRight size={10} />
        </button>
      </div>

      <div className="flex flex-col max-h-[340px] overflow-y-auto">
        {pipelines.map((pipeline) => {
          const { icon: Icon, className, spin } = statusConfig[pipeline.status];

          return (
            <div
              key={pipeline.id}
              onClick={() => pipeline.url && openUrl(pipeline.url)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors",
                "hover:bg-elevated cursor-pointer"
              )}
            >
              <Icon
                size={13}
                className={cn("flex-shrink-0", className, spin && "animate-spin")}
              />

              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-[13px] text-fg-secondary group-hover:text-fg">
                  {pipeline.name} · {pipeline.branch}
                </span>
                <span className="text-[11px] text-fg-disabled">
                  → {pipeline.target} · {pipeline.duration}
                </span>
              </div>

              <div className="flex-shrink-0 text-right">
                <span className="text-[11px] text-fg-disabled">{pipeline.ago}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
