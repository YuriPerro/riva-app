import type { ReactNode } from 'react';

export interface LoadingStateProps {
  icon: ReactNode;
  title: string;
  phrases: string[];
  compact?: boolean;
}
