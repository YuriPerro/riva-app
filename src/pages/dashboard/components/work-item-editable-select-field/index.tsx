import { Loader2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditableSelectField } from './use-editable-select-field';
import type { EditableSelectFieldProps } from './types';

export function EditableSelectField(props: EditableSelectFieldProps) {
  const { icon: Icon, label, value, fieldPath, options, onSave, isUpdating, valueClassName } = props;

  const handleSave = (optionValue: number) => {
    onSave(fieldPath, optionValue);
  };

  const { containerRef, open, toggle, handleSelect } = useEditableSelectField(handleSave);

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
          <Icon size={11} />
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          {isUpdating ? (
            <Loader2 size={12} className="animate-spin text-fg-disabled" />
          ) : (
            <span className={cn('text-[13px] text-fg-secondary', valueClassName)}>{value}</span>
          )}
          <ChevronDown
            size={10}
            className={cn('ml-auto shrink-0 text-fg-disabled transition-transform duration-150', open && 'rotate-180')}
          />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
          {options.map((option) => {
            const active = option.label === value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors',
                  active ? 'text-fg' : 'text-fg-secondary hover:bg-elevated hover:text-fg',
                )}
              >
                <span className={cn('flex-1', option.className)}>{option.label}</span>
                {active && <Check size={11} className="shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
