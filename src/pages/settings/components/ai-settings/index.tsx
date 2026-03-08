import { Eye, EyeOff, Sparkles, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiSettings } from './use-openai-settings';

export function AiSettings() {
  const {
    hasKey,
    maskedKey,
    keyInput,
    setKeyInput,
    isVisible,
    setIsVisible,
    isSaving,
    isRemoving,
    handleSave,
    handleRemove,
  } = useAiSettings();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" />
        <span className="text-sm font-medium text-fg">AI</span>
      </div>
      <span className="text-xs text-fg-muted">Generate natural-language standup summaries with AI</span>

      {hasKey ? (
        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center rounded-md border border-border bg-base px-3 text-xs text-fg-muted font-mono">
            {maskedKey}
          </div>
          <Button variant="outline" size="sm" onClick={handleRemove} disabled={isRemoving}>
            <Trash2 className="size-3.5" />
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={isVisible ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-..."
              className="flex h-9 w-full rounded-md border border-border bg-base px-3 pr-8 text-xs text-fg font-mono placeholder:text-fg-disabled focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-fg-muted hover:text-fg"
            >
              {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || !keyInput.trim()}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md bg-base px-3 py-2">
        <Info size={12} className="mt-0.5 shrink-0 text-fg-muted" />
        <div className="flex flex-col gap-0.5 text-[11px] text-fg-muted leading-relaxed">
          <span>Your key is stored locally at ~/.riva/openai.json</span>
          <span>Only task titles, statuses, and PR titles are sent — never code or descriptions</span>
          <span>No data is cached or stored after generation</span>
        </div>
      </div>
    </div>
  );
}
