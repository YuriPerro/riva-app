import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeCardProps } from "./types";

export function ThemeCard(props: ThemeCardProps) {
  const { preset, active, onSelect } = props;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative w-40 cursor-pointer overflow-hidden rounded-lg border transition-all",
        active ? "border-transparent" : "border-border hover:border-fg-disabled"
      )}
      style={active ? { borderColor: `${preset.accent}60` } : undefined}
    >
      <div
        className="flex flex-col"
        style={{ backgroundColor: preset.base }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ backgroundColor: preset.surface }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: preset.accent }}
          />
          <span
            className="text-[11px] font-medium text-fg"
            style={{ fontFamily: preset.font }}
          >
            {preset.label}
          </span>
          {active && (
            <Check size={12} className="ml-auto text-accent" />
          )}
        </div>

        <div className="flex gap-2 px-3 py-3">
          <div
            className="flex flex-1 flex-col gap-1.5 rounded-md p-2"
            style={{ backgroundColor: preset.surface }}
          >
            <div
              className="h-1.5 w-3/4 rounded-full"
              style={{ backgroundColor: preset.accent, opacity: 0.8 }}
            />
            <div className="h-1.5 w-full rounded-full bg-fg-disabled/20" />
            <div className="h-1.5 w-2/3 rounded-full bg-fg-disabled/20" />
          </div>

          <div
            className="flex flex-1 flex-col gap-1.5 rounded-md p-2"
            style={{ backgroundColor: preset.surface }}
          >
            <div className="h-1.5 w-1/2 rounded-full bg-fg-disabled/20" />
            <div
              className="h-4 w-full rounded"
              style={{ backgroundColor: preset.accent, opacity: 0.15 }}
            />
            <div className="h-1.5 w-3/4 rounded-full bg-fg-disabled/20" />
          </div>
        </div>

        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderTop: `1px solid ${preset.accent}20` }}
        >
          <span
            className="text-[10px] text-fg-muted"
            style={{ fontFamily: preset.font }}
          >
            {preset.font}
          </span>
          <div className="flex gap-1">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.accent }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.base }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.surface }} />
          </div>
        </div>
      </div>
    </button>
  );
}
