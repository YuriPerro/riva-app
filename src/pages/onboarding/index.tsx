import { Eye, EyeOff, ExternalLink, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useOnboarding } from './use-onboarding';

export function OnboardingPage() {
  const { form, isConnecting, showToken, toggleShowToken, onSubmit } = useOnboarding();

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div data-tauri-drag-region className="flex h-full min-h-screen items-center justify-center bg-base">
      <div className="w-full max-w-[400px] px-4">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface">
            <Zap size={18} className="text-fg" />
          </div>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-fg">Connect to Azure DevOps</h1>
            <p className="mt-1 text-[13px] text-fg-muted">
              Enter your organization URL and a Personal Access Token to get started.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="organizationUrl" className="text-[12px] text-fg-secondary">
              Organization URL
            </Label>
            <Input
              id="organizationUrl"
              placeholder="https://dev.azure.com/your-org"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                'h-9 rounded-md border-border bg-surface text-[13px] text-fg',
                'placeholder:text-fg-disabled',
                'focus-visible:ring-1 focus-visible:ring-fg focus-visible:ring-offset-0',
                errors.organizationUrl && 'border-error',
              )}
              {...register('organizationUrl')}
            />
            {errors.organizationUrl && <span className="text-[11px] text-error">{errors.organizationUrl.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="personalAccessToken" className="text-[12px] text-fg-secondary">
                Personal Access Token
              </Label>
              <a
                href="https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-fg-muted transition-colors hover:text-fg-secondary"
              >
                How to create
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <Input
                id="personalAccessToken"
                type={showToken ? 'text' : 'password'}
                placeholder="••••••••••••••••••••••••"
                autoComplete="off"
                spellCheck={false}
                className={cn(
                  'h-9 rounded-md border-border bg-surface pr-10 text-[13px] text-fg',
                  'placeholder:text-fg-disabled',
                  'focus-visible:ring-1 focus-visible:ring-fg focus-visible:ring-offset-0',
                  errors.personalAccessToken && 'border-error',
                )}
                {...register('personalAccessToken')}
              />
              <button
                type="button"
                onClick={toggleShowToken}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-fg-muted transition-colors hover:text-fg-secondary"
              >
                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {errors.personalAccessToken && (
              <span className="text-[11px] text-error">{errors.personalAccessToken.message}</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isConnecting}
            className={cn(
              'mt-2 h-9 w-full rounded-md bg-accent text-[13px] font-medium text-accent-fg',
              'hover:bg-accent-muted disabled:opacity-50 transition-colors',
            )}
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Connecting...
              </span>
            ) : (
              'Connect'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-fg-disabled">
          Your PAT is stored locally and never leaves your device.
        </p>
      </div>
    </div>
  );
}
