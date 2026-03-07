import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PeriodSelectorProps } from '../standup-dialog/types';

const PERIODS = [
  { value: 1, label: 'Yesterday' },
  { value: 2, label: 'Last 2 days' },
  { value: 3, label: 'Last 3 days' },
];

export function PeriodSelector(props: PeriodSelectorProps) {
  const { value, onChange } = props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PERIODS.find((p) => p.value === value) ?? PERIODS[0];

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] text-fg-muted transition-colors hover:text-fg"
      >
        {current.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[120px] rounded-md border border-border bg-overlay p-1 shadow-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
              className={cn(
                'flex w-full cursor-pointer rounded px-2 py-1 text-left text-[11px] transition-colors',
                p.value === value ? 'bg-elevated text-fg' : 'text-fg-muted hover:bg-elevated hover:text-fg',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
