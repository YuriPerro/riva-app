import type { ReactNode } from 'react';

export interface PageTransitionProps {
  isLoading: boolean;
  loadingContent: ReactNode;
  children: ReactNode;
}
