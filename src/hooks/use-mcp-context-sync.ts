import { useEffect } from 'react';
import { mcp } from '@/lib/tauri';
import { useSessionStore } from '@/store/session';

export function useMcpContextSync() {
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);

  useEffect(() => {
    mcp.setContext(project, team).catch(() => {});
  }, [project, team]);
}
