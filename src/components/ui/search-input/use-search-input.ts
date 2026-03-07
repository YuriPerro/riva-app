import { useRef, useEffect, useCallback } from 'react';

export function useSearchInput(value: string, onChange: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(raw), 200);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.focus();
  }, [onChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return {
    inputRef,
    handleChange,
    handleClear,
    hasValue: !!value,
  };
}
