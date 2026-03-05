import { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Flag,
  GitBranch,
  Clock,
  Hourglass,
  CheckCircle2,
  ShieldAlert,
  Zap,
  ChevronDown,
  Check,
  Copy,
  CheckCheck,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ShineBorder } from "@/components/ui/shine-border";
import { buildBranchName } from "@/utils/formatters";
import { mapWorkItemType } from "@/utils/mappers";
import { useWorkItemDetail } from "./use-work-item-detail";
import type { WorkItemDetailDialogProps, PriorityLabel, DisplayDetail, DetailFieldProps } from "./types";

type DevFieldKey = "effort" | "completedWork" | "remainingWork" | "dueDate" | "devStartDate" | "devEndDate" | "blocked";

const DEV_FIELD_META: Record<DevFieldKey, { icon: React.ElementType; label: string }> = {
  effort:        { icon: Zap,          label: "Effort" },
  completedWork: { icon: CheckCircle2, label: "Completed Work" },
  remainingWork: { icon: Hourglass,    label: "Remaining Work" },
  dueDate:       { icon: Calendar,     label: "Due Date" },
  devStartDate:  { icon: Calendar,     label: "Dev Start Date" },
  devEndDate:    { icon: Calendar,     label: "Dev End Date" },
  blocked:       { icon: ShieldAlert,  label: "Blocked" },
};

const DEV_FIELDS_BY_TYPE: Record<string, DevFieldKey[]> = {
  Task:                   ["effort", "completedWork", "remainingWork", "dueDate", "blocked"],
  Bug:                    ["effort", "completedWork", "remainingWork", "devStartDate", "devEndDate", "blocked"],
  "Product Backlog Item": ["effort", "devStartDate", "devEndDate", "blocked"],
  Feature:                ["effort", "devStartDate", "devEndDate", "blocked"],
  Epic:                   ["effort", "devStartDate", "devEndDate", "blocked"],
};

const DEFAULT_DEV_FIELDS: DevFieldKey[] = ["effort", "blocked"];

const priorityConfig: Record<PriorityLabel, string> = {
  Critical: "text-error",
  High:     "text-warning",
  Medium:   "text-info",
  Low:      "text-fg-muted",
  None:     "text-fg-disabled",
};

export function WorkItemDetailDialog(props: WorkItemDetailDialogProps) {
  const { itemId, project, onClose } = props;
  const {
    detail,
    theme,
    states,
    isLoading,
    isUpdating,
    updateState,
    error,
  } = useWorkItemDetail(project, itemId);

  const isOpen = itemId !== null;
  const TypeIcon = theme.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
        <ShineBorder shineColor={theme.shineColors} borderWidth={1} duration={10} />
        {detail && (
          <button
            onClick={() => openUrl(detail.webUrl)}
            className="absolute right-14 top-4 flex cursor-pointer items-center gap-1 rounded-sm text-[11px] text-fg-muted opacity-70 transition-opacity hover:opacity-100"
          >
            View in DevOps
            <ExternalLink size={11} />
          </button>
        )}
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
            <DialogHeader className="mt-3">
              <span className="text-[14px] text-fg-disabled">#{itemId}</span>
              <DialogTitle className="text-[17px] leading-snug">
                {detail.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Work item details for {detail.title}
              </DialogDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <TypeIcon size={12} className={theme.className} />
                  <span className={cn("text-[11px] font-medium", theme.className)}>
                    {detail.type}
                  </span>
                </div>
                {detail.tags.length > 0 && (
                  <>
                    <span className="text-fg-disabled">·</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {detail.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-fg-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <StatusField
                  currentState={detail.state}
                  states={states}
                  isUpdating={isUpdating}
                  onSelect={updateState}
                />
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

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <Clock size={11} />
                  Dev
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(DEV_FIELDS_BY_TYPE[detail.type] ?? DEFAULT_DEV_FIELDS).map((key) => {
                    const meta = DEV_FIELD_META[key];
                    const raw = detail[key as keyof DisplayDetail] as string | null;
                    const value = raw ?? "—";
                    return (
                      <DetailField
                        key={key}
                        icon={meta.icon}
                        label={meta.label}
                        value={value}
                        valueClassName={key === "blocked" && value === "Yes" ? "text-error" : undefined}
                      />
                    );
                  })}
                </div>
              </div>

              <BranchField
                id={itemId!}
                type={detail.type}
              />

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

          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StatusFieldProps {
  currentState: string;
  states: { name: string; color: string; category: string }[];
  isUpdating: boolean;
  onSelect: (state: string) => void;
}

function StatusField(props: StatusFieldProps) {
  const { currentState, states, isUpdating, onSelect } = props;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (stateName: string) => {
    if (stateName === currentState) {
      setOpen(false);
      return;
    }
    onSelect(stateName);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isUpdating}
        className={cn(
          "flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
          open ? "bg-elevated" : "hover:bg-elevated"
        )}
      >
        <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
          <Flag size={11} />
          Status
        </div>
        <div className="flex items-center gap-1.5">
          {isUpdating ? (
            <Loader2 size={12} className="animate-spin text-fg-disabled" />
          ) : (
            <span className="text-[13px] text-fg-secondary">{currentState}</span>
          )}
          <ChevronDown
            size={10}
            className={cn(
              "ml-auto shrink-0 text-fg-disabled transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && states.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
          {states.map((s) => {
            const active = s.name === currentState;
            return (
              <button
                key={s.name}
                onClick={() => handleSelect(s.name)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors",
                  active
                    ? "text-fg"
                    : "text-fg-secondary hover:bg-elevated hover:text-fg"
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `#${s.color}` }}
                />
                <span className="flex-1">{s.name}</span>
                {active && <Check size={11} className="shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface BranchFieldProps {
  id: number;
  type: string;
}

function BranchField(props: BranchFieldProps) {
  const { id, type } = props;
  const [copied, setCopied] = useState(false);
  const branch = buildBranchName(id, mapWorkItemType(type));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(branch);
    setCopied(true);
    toast.success("Branch name copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const CopyIcon = copied ? CheckCheck : Copy;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
        <GitBranch size={11} />
        Branch
      </div>
      <button
        onClick={handleCopy}
        className="flex w-full cursor-pointer items-center gap-2 rounded-md bg-elevated px-3 py-2 text-left transition-colors hover:bg-border"
      >
        <code className="flex-1 truncate text-[12px] text-fg-secondary">{branch}</code>
        <CopyIcon size={12} className={cn("shrink-0", copied ? "text-success" : "text-fg-muted")} />
      </button>
    </div>
  );
}

function DetailField(props: DetailFieldProps) {
  const { icon: Icon, label, value, valueClassName } = props;

  return (
    <div className="flex flex-col gap-0.5 rounded-md px-2 py-1.5">
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
