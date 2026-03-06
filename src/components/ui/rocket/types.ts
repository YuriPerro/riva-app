import type { HTMLAttributes } from 'react';

export interface RocketHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface RocketProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}
