import { Loader2 } from 'lucide-react';
import { useEditableTitle } from './use-editable-title';
import type { EditableTitleProps } from './types';

export function EditableTitle(props: EditableTitleProps) {
  const { title, onSave, isUpdating } = props;
  const { isEditing, editValue, textareaRef, startEditing, save, handleChange, handleKeyDown } =
    useEditableTitle(title, onSave);

  if (isUpdating) {
    return (
      <span className="flex items-center gap-2 text-[17px] font-semibold leading-snug text-fg">
        {title}
        <Loader2 size={14} className="animate-spin text-fg-disabled" />
      </span>
    );
  }

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={handleChange}
        onBlur={save}
        onKeyDown={handleKeyDown}
        rows={1}
        className="w-full resize-none overflow-hidden rounded-md border border-accent bg-elevated px-2 py-1 text-[17px] font-semibold leading-snug text-fg outline-none"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={startEditing}
      className="cursor-pointer rounded-md px-2 py-1 text-left text-[17px] font-semibold leading-snug text-fg transition-colors hover:bg-elevated"
    >
      {title}
    </button>
  );
}
