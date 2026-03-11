import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditableToggleFieldProps } from './types';

export function EditableToggleField(props: EditableToggleFieldProps) {
  const { icon: Icon, label, value, fieldPath, onSave, isUpdating } = props;
  const isBlocked = value === 'Yes';

  const toggle = () => {
    const newValue = isBlocked ? 'No' : 'Yes';
    onSave(fieldPath, newValue);
  };

  return (
    <div className="flex flex-col gap-0.5 rounded-md px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
        <Icon size={11} />
        {label}
      </div>

      {isUpdating ? (
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[13px]', isBlocked ? 'text-error' : 'text-fg-secondary')}>{value}</span>
          <Loader2 size={11} className="animate-spin text-fg-disabled" />
        </div>
      ) : (
        <button
          onClick={toggle}
          className={cn(
            'cursor-pointer rounded px-0 py-0 text-left text-[13px] transition-colors hover:text-fg',
            isBlocked ? 'text-error' : 'text-fg-secondary',
          )}
        >
          {value}
        </button>
      )}
    </div>
  );
}
