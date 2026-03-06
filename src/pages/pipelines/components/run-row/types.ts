import type { PipelineRunItem, PipelineStatus } from '../../use-pipelines';

export interface RunRowProps {
  run: PipelineRunItem;
  onClick: () => void;
}

export interface StatusConfig {
  icon: React.ElementType;
  className: string;
  spin?: boolean;
  dot: string;
}

export type StatusConfigMap = Record<PipelineStatus, StatusConfig>;
