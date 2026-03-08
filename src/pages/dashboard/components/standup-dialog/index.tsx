import { Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PeriodSelector } from '../standup-period-selector';
import { StandupContent } from '../standup-content';
import { StandupAiSummary } from '../standup-ai-summary';
import { useStandupDialog } from './use-standup-dialog';
import type { StandupDialogProps } from './types';

export function StandupDialog(props: StandupDialogProps) {
  const { open, onOpenChange, standup, isLoading, period, onPeriodChange } = props;
  const { copied, isEmpty, yesterdayGroups, todayGroups, hasTodayContent, clipboardText, handleCopy } =
    useStandupDialog(standup);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-[13px] font-semibold">Standup Summary</DialogTitle>
            <div className="flex items-center gap-2">
              <PeriodSelector value={period} onChange={onPeriodChange} />
              <button
                onClick={handleCopy}
                disabled={isEmpty || isLoading}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] text-fg-muted transition-colors hover:text-fg disabled:cursor-default disabled:opacity-40"
              >
                {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Summary of your recent work activity for standup meetings
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-1">
          <StandupContent
            isLoading={isLoading}
            isEmpty={isEmpty}
            standup={standup}
            yesterdayGroups={yesterdayGroups}
            todayGroups={todayGroups}
            hasTodayContent={hasTodayContent}
          />
          {!isLoading && !isEmpty && (
            <StandupAiSummary clipboardText={clipboardText} disabled={isEmpty} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
