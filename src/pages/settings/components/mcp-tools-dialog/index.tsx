import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { McpToolRow } from '../mcp-tool-row';
import { useMcpToolsDialog } from './use-mcp-tools-dialog';

export function McpToolsDialog() {
  const { t } = useTranslation(['settings', 'common']);
  const { open, onOpenChange, tools, isLoading } = useMcpToolsDialog();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Wrench className="size-3.5" />
          {t('settings:mcp.viewTools')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('settings:mcp.toolsDialog.title')}</DialogTitle>
          <DialogDescription>{t('settings:mcp.toolsDialog.description')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {isLoading && (
            <div className="py-8 text-center text-xs text-fg-muted">
              {t('common:actions.loading')}
            </div>
          )}
          {!isLoading && tools.length === 0 && (
            <div className="py-8 text-center text-xs text-fg-muted">
              {t('settings:mcp.toolsDialog.empty')}
            </div>
          )}
          {!isLoading && tools.length > 0 && (
            <ul className="flex flex-col gap-3">
              {tools.map((tool) => (
                <McpToolRow key={tool.name} tool={tool} />
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

