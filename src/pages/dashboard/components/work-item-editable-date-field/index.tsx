import { Loader2 } from 'lucide-react';
import { useEditableDateField } from './use-editable-date-field';
import type { EditableDateFieldProps } from './types';

export function EditableDateField(props: EditableDateFieldProps) {
  const { icon: Icon, label, value, fieldPath, onSave, isUpdating } = props;
  const { isEditing, editValue, inputRef, startEditing, save, setEditValue, handleKeyDown } =
    useEditableDateField(value, fieldPath, onSave);

  return (
    <div className="flex flex-col gap-0.5 rounded-md px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
        <Icon size={11} />
        {label}
      </div>

      {isUpdating && (
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] text-fg-secondary">{value ?? '—'}</span>
          <Loader2 size={11} className="animate-spin text-fg-disabled" />
        </div>
      )}

      {!isUpdating && isEditing && (
        <input
          ref={inputRef}
          type="datetime-local"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-accent bg-elevated px-1.5 py-0.5 text-[13px] text-fg outline-none"
          autoFocus
        />
      )}

      {!isUpdating && !isEditing && (
        <button
          onClick={startEditing}
          className="cursor-pointer rounded px-0 py-0 text-left text-[13px] text-fg-secondary transition-colors hover:text-fg"
        >
          {value ?? '—'}
        </button>
      )}
    </div>
  );
}
