import { useState, useRef, useCallback, useEffect } from 'react';

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function useEditableTitle(title: string, onSave: (newTitle: string) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = useCallback(() => {
    setEditValue(title);
    setIsEditing(true);
    setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      autoResize(el);
      el.select();
    }, 0);
  }, [title]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(title);
  }, [title]);

  const save = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [editValue, title, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    autoResize(e.target);
  }, []);

  useEffect(() => {
    if (isEditing) autoResize(textareaRef.current);
  }, [isEditing]);

  return {
    isEditing,
    editValue,
    textareaRef,
    startEditing,
    cancel,
    save,
    handleChange,
    handleKeyDown,
  };
}
