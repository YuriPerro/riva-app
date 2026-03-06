import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ReviewerDotProps, VoteConfigMap } from "./types";

const VOTE_CONFIG: VoteConfigMap = {
  approved: { icon: Check,  className: "text-success",  title: "Approved"  },
  rejected: { icon: X,      className: "text-error",    title: "Rejected"  },
  waiting:  { icon: Clock,  className: "text-fg-muted", title: "Waiting"   },
  none:     { icon: Clock,  className: "text-fg-muted", title: "No vote"   },
};

export function ReviewerDot(props: ReviewerDotProps) {
  const { reviewer } = props;
  const { icon: Icon, className, title } = VOTE_CONFIG[reviewer.vote];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative flex h-6 w-6 cursor-pointer items-center justify-center">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-semibold",
              reviewer.vote === "approved" ? "border-success/40 bg-success/15 text-success" :
              reviewer.vote === "rejected" ? "border-error/40 bg-error/15 text-error" :
              "border-border bg-elevated text-fg-muted"
            )}
          >
            {reviewer.initials}
          </span>
          <Icon
            size={9}
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full bg-surface p-px",
              className,
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="flex items-center gap-1.5">
          <Icon size={10} className={className} />
          <span>{reviewer.displayName}</span>
          <span className="text-fg-disabled">· {title}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
