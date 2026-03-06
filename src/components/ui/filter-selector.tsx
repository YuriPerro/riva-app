import { useState, useRef, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSelectorProps {
  options: string[];
  selected: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
}

export function FilterSelector({ options, selected, onAdd, onRemove, placeholder = 'Filter' }: FilterSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const available = options.filter((o) => !selected.includes(o));
  const filtered = search ? available.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : available;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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

  // Nothing to show
  if (selected.length === 0 && available.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Selected badges */}
      {selected.map((value) => (
        <span
          key={value}
          className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-accent"
        >
          <span className="max-w-[130px] truncate">{value}</span>
          <button
            onClick={() => onRemove(value)}
            className="ml-0.5 flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent/20"
          >
            <X size={9} />
          </button>
        </span>
      ))}

      {/* Add trigger */}
      {available.length > 0 && (
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              open
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border bg-surface text-fg-secondary hover:text-fg',
            )}
          >
            <Plus size={10} />
            {selected.length === 0 && <span>{placeholder}</span>}
          </button>

          {open && (
            <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search size={12} className="shrink-0 text-fg-disabled" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-transparent text-[12px] text-fg placeholder:text-fg-disabled focus:outline-none"
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-fg-disabled">No matches</div>
                ) : (
                  filtered.map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        onAdd(value);
                        setSearch('');
                        setOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-[12px] text-fg-secondary transition-colors hover:bg-elevated hover:text-fg"
                    >
                      <span className="truncate">{value}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
