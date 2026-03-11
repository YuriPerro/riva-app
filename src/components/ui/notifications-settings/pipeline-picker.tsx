import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DefinitionPickerProps {
  definitions: { id: number; name: string }[];
  monitoredIds: number[];
  monitorAll: boolean;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  allLabel: string;
  selectedLabel: (count: number) => string;
  searchPlaceholder: string;
  noMatchLabel: string;
}

export function DefinitionPicker(props: DefinitionPickerProps) {
  const { definitions, monitoredIds, monitorAll, onToggle, onToggleAll, allLabel, selectedLabel, searchPlaceholder, noMatchLabel } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? definitions.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : definitions;

  const selectedCount = monitorAll ? definitions.length : monitoredIds.length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const label = monitorAll ? allLabel : selectedLabel(selectedCount);

  return (
    <div ref={containerRef} className="relative ml-9 mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between rounded-md border px-2.5 py-1.5 text-[11px] transition-colors',
          open
            ? 'border-accent/40 bg-accent/5 text-accent'
            : 'border-border bg-base text-fg-secondary hover:text-fg',
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={12} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-1.5">
            <Search size={11} className="shrink-0 text-fg-disabled" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-[11px] text-fg placeholder:text-fg-disabled focus:outline-none"
            />
          </div>

          <div className="max-h-[180px] overflow-y-auto">
            {!search && (
              <button
                type="button"
                onClick={onToggleAll}
                className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[11px] transition-colors hover:bg-elevated"
              >
                <div className={cn(
                  'flex size-3 items-center justify-center rounded-sm border',
                  monitorAll ? 'border-accent bg-accent' : 'border-border',
                )}>
                  {monitorAll && <Check size={8} className="text-accent-fg" />}
                </div>
                <span className={cn('font-medium', monitorAll ? 'text-accent' : 'text-fg-secondary')}>
                  {allLabel}
                </span>
              </button>
            )}

            {filtered.length === 0 && (
              <div className="px-2.5 py-2 text-[11px] text-fg-disabled">
                {noMatchLabel}
              </div>
            )}

            {filtered.map((def) => {
              const isChecked = monitorAll || monitoredIds.includes(def.id);
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => onToggle(def.id)}
                  className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[11px] transition-colors hover:bg-elevated"
                >
                  <div className={cn(
                    'flex size-3 items-center justify-center rounded-sm border',
                    isChecked ? 'border-accent bg-accent' : 'border-border',
                  )}>
                    {isChecked && <Check size={8} className="text-accent-fg" />}
                  </div>
                  <span className={cn('truncate', isChecked ? 'text-fg' : 'text-fg-muted')}>
                    {def.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
