import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { mcp } from '@/lib/tauri';
import type { McpToolInfo } from '@/types/mcp';
import type { McpToolArg } from './types';

export function useMcpToolsDialog() {
  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<McpToolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = useCallback(async (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setIsLoading(true);
    try {
      const list = await mcp.listTools();
      setTools(list);
    } catch (err) {
      toast.error(`Failed to load MCP tools: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { open, onOpenChange: handleOpenChange, tools, isLoading };
}

export function parseToolArgs(inputSchema: Record<string, unknown>): McpToolArg[] {
  const props = inputSchema['properties'];
  if (!props || typeof props !== 'object') return [];

  const required = new Set(
    Array.isArray(inputSchema['required']) ? (inputSchema['required'] as string[]) : [],
  );

  return Object.entries(props as Record<string, unknown>).map(([name, raw]) => {
    const schema = (raw ?? {}) as Record<string, unknown>;
    const type = resolveType(schema);
    const description =
      typeof schema['description'] === 'string' ? (schema['description'] as string) : undefined;
    return {
      name,
      type,
      required: required.has(name),
      description,
    };
  });
}

function resolveType(schema: Record<string, unknown>): string {
  const directType = schema['type'];
  if (typeof directType === 'string') return directType;
  if (Array.isArray(directType)) return directType.filter((t) => t !== 'null').join(' | ') || 'any';

  const anyOf = schema['anyOf'];
  if (Array.isArray(anyOf)) {
    const types = anyOf
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const t = (entry as Record<string, unknown>)['type'];
        return typeof t === 'string' ? t : null;
      })
      .filter((t): t is string => !!t && t !== 'null');
    if (types.length > 0) return types.join(' | ');
  }

  return 'any';
}
