import { useState, useEffect } from 'react';

export function useLoadingState(phrasesCount: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (phrasesCount <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % phrasesCount);
        setIsVisible(true);
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [phrasesCount]);

  return { currentIndex, isVisible };
}
