import type { ElementType } from 'react';

export enum SetupStep {
  Language = 0,
  Theme = 1,
  Ai = 2,
  Notifications = 3,
}

export type SetupStepConfig = {
  step: SetupStep;
  title: string;
  subtitle: string;
  icon: ElementType;
};
