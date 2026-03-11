import { useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';

function toInputValue(displayDate: string | null): string {
  if (!displayDate) return '';
  const parsed = dayjs(displayDate, ['M/D/YYYY h:mm A', 'M/D/YYYY, h:mm A', 'YYYY-MM-DDTHH:mm']);
  return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm') : '';
}

function toIsoString(inputValue: string): string | null {
  if (!inputValue) return null;
  const parsed = dayjs(inputValue);
  return parsed.isValid() ? parsed.toISOString() : null;
}

export function useEditableDateField(
  value: string | null,
  fieldPath: string,
  onSave: (fieldPath: string, value: string | null) => void,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    setEditValue(toInputValue(value));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.showPicker?.(), 0);
  }, [value]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const save = useCallback(() => {
    const newIso = toIsoString(editValue);
    const oldIso = toIsoString(toInputValue(value));
    const hasChanged = newIso !== oldIso;

    if (hasChanged) {
      onSave(fieldPath, newIso);
    }
    setIsEditing(false);
  }, [editValue, value, fieldPath, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel],
  );

  return {
    isEditing,
    editValue,
    inputRef,
    startEditing,
    save,
    setEditValue,
    handleKeyDown,
  };
}
