import type { ReleaseEnvironmentStatus } from '@/types/release';

export interface EnvironmentDotProps {
  name: string;
  status: ReleaseEnvironmentStatus;
}
