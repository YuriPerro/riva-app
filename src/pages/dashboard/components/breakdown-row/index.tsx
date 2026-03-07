import type { BreakdownRowProps } from './types';

export function BreakdownRow(props: BreakdownRowProps) {
  const { label, value, max, description } = props;
  const pct = (value / max) * 100;

  return (
    <div className="rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-fg">{label}</span>
        <span className="text-[12px] tabular-nums text-fg-muted">{value}/{max}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-fg-disabled">{description}</div>
    </div>
  );
}
