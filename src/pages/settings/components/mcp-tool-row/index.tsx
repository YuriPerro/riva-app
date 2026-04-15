import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { parseToolArgs } from '../mcp-tools-dialog/use-mcp-tools-dialog';
import type { McpToolRowProps } from './types';

export function McpToolRow(props: McpToolRowProps) {
  const { tool } = props;
  const { t } = useTranslation(['settings']);
  const args = parseToolArgs(tool.input_schema);

  return (
    <li className="flex flex-col gap-2 rounded-md border border-border-subtle bg-base p-3">
      <div className="flex items-center gap-2">
        <code className="text-xs font-semibold text-fg">{tool.name}</code>
        <Badge variant="outline" className="text-[10px]">
          {args.length} {t('settings:mcp.toolsDialog.argsLabel')}
        </Badge>
      </div>
      {tool.description && (
        <p className="text-xs leading-relaxed text-fg-secondary">{tool.description}</p>
      )}
      {args.length > 0 && (
        <ul className="flex flex-col gap-1">
          {args.map((arg) => (
            <li key={arg.name} className="flex items-start gap-2 text-[11px]">
              <code className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-fg">
                {arg.name}
              </code>
              <span className="shrink-0 text-fg-muted">{arg.type}</span>
              {arg.required && (
                <Badge className="shrink-0 border-warning/30 bg-warning/10 px-1 py-0 text-[9px] text-warning">
                  {t('settings:mcp.toolsDialog.required')}
                </Badge>
              )}
              {arg.description && <span className="text-fg-muted">— {arg.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
