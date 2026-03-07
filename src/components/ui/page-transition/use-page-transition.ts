import { useState, useEffect, useRef } from 'react';

export type TransitionPhase = 'loading' | 'fading-out' | 'content';

const FADE_DURATION = 300;
const INSTANT_THRESHOLD = 50;

export function usePageTransition(isLoading: boolean) {
  const [phase, setPhase] = useState<TransitionPhase>(isLoading ? 'loading' : 'content');
  const loadStartRef = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (isLoading) {
      loadStartRef.current = Date.now();
      setPhase('loading');
      return;
    }

    const elapsed = loadStartRef.current ? Date.now() - loadStartRef.current : 0;
    const isInstant = elapsed < INSTANT_THRESHOLD;

    if (isInstant) {
      setPhase('content');
      return;
    }

    setPhase('fading-out');
    const timer = setTimeout(() => setPhase('content'), FADE_DURATION);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return { phase };
}
