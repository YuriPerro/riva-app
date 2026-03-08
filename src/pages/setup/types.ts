import type { ElementType } from 'react';

export enum SetupStep {
  Theme = 0,
  Ai = 1,
  Notifications = 2,
}

export type SetupStepConfig = {
  step: SetupStep;
  title: string;
  subtitle: string;
  icon: ElementType;
};
