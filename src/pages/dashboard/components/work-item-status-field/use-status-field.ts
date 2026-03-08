import { useState, useRef, useEffect, useCallback } from 'react';

export function useStatusField(currentState: string, onSelect: (state: string) => void) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const handleSelect = useCallback(
    (stateName: string) => {
      if (stateName === currentState) {
        setOpen(false);
        return;
      }
      onSelect(stateName);
      setOpen(false);
    },
    [currentState, onSelect],
  );

  return { containerRef, open, toggle, handleSelect };
}
