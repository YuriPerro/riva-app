import { useState, useRef, useEffect, useCallback } from 'react';

export function usePeriodSelector(onChange: (v: number) => void) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const select = useCallback(
    (value: number) => {
      onChange(value);
      setOpen(false);
    },
    [onChange],
  );

  return { ref, open, toggle, select };
}
