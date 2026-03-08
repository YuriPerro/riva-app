import { Eye, EyeOff, Shield, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetupAi } from './use-setup-ai';

export function SetupAi() {
  const { keyInput, setKeyInput, isVisible, setIsVisible, isSaving, isSaved, handleSave } = useSetupAi();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {isSaved ? (
          <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/5 px-3 py-2.5">
            <CheckCircle2 size={14} className="shrink-0 text-success" />
            <span className="text-[12px] text-success">API key saved. AI summaries are ready.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={isVisible ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-..."
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 pr-8 font-mono text-xs text-fg placeholder:text-fg-disabled focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
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
            <button
              onClick={handleSave}
              disabled={isSaving || !keyInput.trim()}
              className={cn(
                'h-9 cursor-pointer rounded-md border border-border bg-surface px-3 text-[12px] font-medium text-fg-secondary transition-colors',
                'hover:bg-elevated disabled:cursor-default disabled:opacity-40',
              )}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-border-subtle bg-surface/50 px-3 py-2.5">
        <Shield size={13} className="mt-0.5 shrink-0 text-fg-disabled" />
        <div className="flex flex-col gap-1 text-[11px] leading-relaxed text-fg-disabled">
          <span>Stored locally at ~/.forge/openai.json</span>
          <span>Only task titles and statuses are sent — never code</span>
        </div>
      </div>
    </div>
  );
}
