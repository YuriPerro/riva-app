import { Flag, Loader2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStatusField } from './use-status-field';
import type { StatusFieldProps } from './types';

export function StatusField(props: StatusFieldProps) {
  const { currentState, states, isUpdating, onSelect } = props;
  const { containerRef, open, toggle, handleSelect } = useStatusField(currentState, onSelect);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        disabled={isUpdating}
        className={cn(
          'flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors',
          open ? 'bg-elevated' : 'hover:bg-elevated',
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
            className={cn('ml-auto shrink-0 text-fg-disabled transition-transform duration-150', open && 'rotate-180')}
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
                  'flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors',
                  active ? 'text-fg' : 'text-fg-secondary hover:bg-elevated hover:text-fg',
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `#${s.color}` }} />
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
