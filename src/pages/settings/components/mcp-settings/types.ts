import type { LucideIcon } from 'lucide-react';
import type { McpClient } from '@/types/mcp';

export interface McpClientCardConfig {
  id: McpClient;
  name: string;
  icon: LucideIcon;
  configHint: string;
}
