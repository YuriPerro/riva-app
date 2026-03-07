import { Sparkles, Copy, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useOpenAiStore } from '@/store/openai';
import type { StandupAiSummaryProps } from './types';
import { useStandupAiSummary } from './use-standup-ai-summary';

export function StandupAiSummary(props: StandupAiSummaryProps) {
  const { clipboardText, disabled } = props;
  const hasKey = useOpenAiStore((s) => !!s.apiKey);
  const {
    summary,
    isGenerating,
    showPrompt,
    copied,
    handleGenerate,
    handleCopy,
    togglePrompt,
  } = useStandupAiSummary(clipboardText);

  if (!hasKey) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={disabled || isGenerating}
          className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] text-fg-muted transition-colors hover:text-fg disabled:cursor-default disabled:opacity-40"
        >
          {isGenerating ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Sparkles size={10} />
          )}
          {isGenerating ? 'Generating...' : 'Generate summary'}
        </button>
      </div>

      {summary && (
        <div className="flex flex-col gap-2 rounded-md bg-base px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              AI Summary
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={togglePrompt}
                className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-fg-muted transition-colors hover:text-fg"
              >
                {showPrompt ? <EyeOff size={10} /> : <Eye size={10} />}
                {showPrompt ? 'Hide prompt' : 'View prompt'}
              </button>
              <button
                onClick={handleCopy}
                className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-fg-muted transition-colors hover:text-fg"
              >
                {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-fg">
            {summary}
          </p>

          {showPrompt && (
            <div className="rounded border border-border-subtle bg-surface px-2 py-1.5">
              <span className="mb-1 block text-[10px] font-medium text-fg-muted">
                Sent to OpenAI:
              </span>
              <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-fg-muted">
                {clipboardText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
