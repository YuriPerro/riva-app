import { useState, useRef, useCallback } from 'react';

export function useEditableNumberField(
  value: string | null,
  fieldPath: string,
  onSave: (fieldPath: string, value: number | null) => void,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    setEditValue(value ?? '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [value]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const save = useCallback(() => {
    const trimmed = editValue.trim();
    const newValue = trimmed === '' ? null : Number(trimmed);
    const oldValue = value === null ? null : Number(value);

    const hasChanged = newValue !== oldValue;
    const isValid = newValue === null || !isNaN(newValue);

    if (hasChanged && isValid) {
      onSave(fieldPath, newValue);
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
