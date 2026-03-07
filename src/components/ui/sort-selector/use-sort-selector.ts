import { useState, useRef, useEffect, useCallback } from 'react';
import type { SortDirection } from './types';

export function useSortSelector<T extends string>(
  value: T,
  direction: SortDirection,
  onChange: (value: T, direction: SortDirection) => void,
) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleOpen = useCallback(() => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setAlignRight(rect.right + 160 > window.innerWidth);
    }
    setOpen((v) => !v);
  }, [open]);

  const handleSelect = useCallback(
    (optionValue: T) => {
      if (optionValue === value) {
        const next: SortDirection = direction === 'asc' ? 'desc' : 'asc';
        onChange(optionValue, next);
      } else {
        onChange(optionValue, 'asc');
      }
      setOpen(false);
    },
    [value, direction, onChange],
  );

  return {
    ref,
    open,
    alignRight,
    toggleOpen,
    handleSelect,
  };
}
