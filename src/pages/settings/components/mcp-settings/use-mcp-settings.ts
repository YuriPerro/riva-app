import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { mcp } from '@/lib/tauri';
import type { McpClient, McpClientStatus, McpSnippet } from '@/types/mcp';

type SnippetState = Record<McpClient, McpSnippet | null>;
type StatusState = Record<McpClient, McpClientStatus | null>;
type BusyState = Record<McpClient, boolean>;

const CLIENTS: McpClient[] = ['claude_code', 'codex'];

const INITIAL_STATUS: StatusState = { claude_code: null, codex: null };
const INITIAL_SNIPPETS: SnippetState = { claude_code: null, codex: null };
const INITIAL_BUSY: BusyState = { claude_code: false, codex: false };

export function useMcpSettings() {
  const [serverUrl, setServerUrl] = useState<string>('');
  const [status, setStatus] = useState<StatusState>(INITIAL_STATUS);
  const [snippets, setSnippets] = useState<SnippetState>(INITIAL_SNIPPETS);
  const [busy, setBusy] = useState<BusyState>(INITIAL_BUSY);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    try {
      const [url, ...results] = await Promise.all([
        mcp.getServerUrl(),
        ...CLIENTS.map((c) => mcp.getClientStatus(c)),
        ...CLIENTS.map((c) => mcp.getSnippet(c)),
      ]);

      const statuses = results.slice(0, CLIENTS.length) as McpClientStatus[];
      const snips = results.slice(CLIENTS.length) as McpSnippet[];

      setServerUrl(url);
      setStatus({
        claude_code: statuses[0],
        codex: statuses[1],
      });
      setSnippets({
        claude_code: snips[0],
        codex: snips[1],
      });
    } catch (err) {
      toast.error(`Failed to load MCP status: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleInstall = useCallback(async (client: McpClient) => {
    setBusy((b) => ({ ...b, [client]: true }));
    try {
      const next = await mcp.install(client);
      setStatus((s) => ({ ...s, [client]: next }));
      toast.success('MCP server installed');
    } catch (err) {
      toast.error(`Failed to install: ${err}`);
    } finally {
      setBusy((b) => ({ ...b, [client]: false }));
    }
  }, []);

  const handleUninstall = useCallback(async (client: McpClient) => {
    setBusy((b) => ({ ...b, [client]: true }));
    try {
      const next = await mcp.uninstall(client);
      setStatus((s) => ({ ...s, [client]: next }));
      toast.success('MCP server removed');
    } catch (err) {
      toast.error(`Failed to remove: ${err}`);
    } finally {
      setBusy((b) => ({ ...b, [client]: false }));
    }
  }, []);

  const handleCopySnippet = useCallback(async (client: McpClient) => {
    const snippet = snippets[client];
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet.content);
      toast.success('Snippet copied');
    } catch {
      toast.error('Failed to copy snippet');
    }
  }, [snippets]);

  const handleCopyUrl = useCallback(async () => {
    if (!serverUrl) return;
    try {
      await navigator.clipboard.writeText(serverUrl);
      toast.success('URL copied');
    } catch {
      toast.error('Failed to copy URL');
    }
  }, [serverUrl]);

  return {
    serverUrl,
    status,
    snippets,
    busy,
    isLoading,
    handleInstall,
    handleUninstall,
    handleCopySnippet,
    handleCopyUrl,
  };
}
