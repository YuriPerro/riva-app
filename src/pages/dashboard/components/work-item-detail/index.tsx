import {
  CheckSquare,
  Bug,
  Layers,
  Zap,
  ExternalLink,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Tag,
  Flag,
  GitBranch,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useWorkItemDetail } from "./use-work-item-detail";
import type { WorkItemDetailDialogProps, PriorityLabel, DetailFieldProps } from "./types";

const typeConfig: Record<string, { icon: React.ElementType; className: string }> = {
  Task:                 { icon: CheckSquare, className: "text-info" },
  Bug:                  { icon: Bug,         className: "text-error" },
  "Product Backlog Item": { icon: Layers,    className: "text-accent" },
  Epic:                 { icon: Zap,         className: "text-warning" },
  Feature:              { icon: Layers,      className: "text-accent" },
};

const priorityConfig: Record<PriorityLabel, string> = {
  Critical: "text-error",
  High:     "text-warning",
  Medium:   "text-info",
  Low:      "text-fg-muted",
  None:     "text-fg-disabled",
};

export function WorkItemDetailDialog(props: WorkItemDetailDialogProps) {
  const { itemId, project, onClose } = props;
  const { detail, isLoading, error } = useWorkItemDetail(project, itemId);

  const isOpen = itemId !== null;
  const typeEntry = detail ? typeConfig[detail.type] ?? typeConfig.Task : typeConfig.Task;
  const TypeIcon = typeEntry.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={16} className="animate-spin text-fg-disabled" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {detail && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <TypeIcon size={16} className={typeEntry.className} />
                <span className={cn("text-[11px] font-medium uppercase", typeEntry.className)}>
                  {detail.type}
                </span>
                <span className="text-[11px] text-fg-disabled">#{itemId}</span>
              </div>
              <DialogTitle className="text-[15px] leading-snug">
                {detail.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Work item details for {detail.title}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <DetailField icon={Flag} label="Status" value={detail.state} />
                <DetailField icon={User} label="Assigned To" value={detail.assignee} />
                <DetailField icon={GitBranch} label="Iteration" value={detail.iterationPath} />
                <DetailField
                  icon={Flag}
                  label="Priority"
                  value={detail.priority}
                  valueClassName={priorityConfig[detail.priority]}
                />
                <DetailField icon={User} label="Created By" value={detail.createdBy} />
                <DetailField icon={Calendar} label="Created" value={detail.createdDate} />
                <DetailField icon={Calendar} label="Last Updated" value={detail.changedDate} />
              </div>

              {detail.tags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                    <Tag size={11} />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-fg-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail.description && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-fg-muted">Description</span>
                  <div
                    className="text-[13px] text-fg-secondary leading-relaxed [&_a]:text-accent [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1"
                    dangerouslySetInnerHTML={{ __html: detail.description }}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-md px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-elevated hover:text-fg-secondary"
              >
                Close
              </button>
              <button
                onClick={() => openUrl(detail.webUrl)}
                className="flex cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] text-accent-fg transition-colors hover:bg-accent/90"
              >
                View in DevOps
                <ExternalLink size={12} />
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailField(props: DetailFieldProps) {
  const { icon: Icon, label, value, valueClassName } = props;

  return (
    <div className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-1.5 transition-colors hover:bg-elevated">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
        <Icon size={11} />
        {label}
      </div>
      <span className={cn("text-[13px] text-fg-secondary", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
