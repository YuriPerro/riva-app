import type { PipelineGroup } from '../../use-pipelines';

export interface PipelineGroupCardProps {
  group: PipelineGroup;
  onToggleFavorite: (definitionId: number) => void;
  onOpenRun: (url: string) => void;
}
