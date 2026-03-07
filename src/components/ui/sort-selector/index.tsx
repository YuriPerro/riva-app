import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortSelector } from './use-sort-selector';
import type { SortSelectorProps } from './types';

export function SortSelector<T extends string = string>(props: SortSelectorProps<T>) {
  const { options, value, direction, onChange } = props;
  const { ref, open, alignRight, toggleOpen, handleSelect } = useSortSelector(value, direction, onChange);

  const currentLabel = options.find((o) => o.value === value)?.label ?? 'Sort';
  const DirectionIcon = direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
          open
            ? 'border-accent/40 bg-accent/10 text-accent'
            : 'border-border bg-surface text-fg-secondary hover:text-fg',
        )}
      >
        {value === options[0]?.value ? (
          <ArrowUpDown size={11} />
        ) : (
          <DirectionIcon size={11} />
        )}
        {currentLabel}
      </button>

      {open && (
        <div className={cn('absolute top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-lg border border-border bg-surface shadow-xl', alignRight ? 'right-0' : 'left-0')}>
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[12px] text-fg-secondary transition-colors hover:bg-elevated hover:text-fg"
              >
                <span className={isActive ? 'text-accent' : ''}>{option.label}</span>
                {isActive && (
                  <span className="flex items-center gap-1 text-accent">
                    {direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    <Check size={10} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
