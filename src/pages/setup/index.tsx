import { cn } from '@/lib/utils';
import { SetupStep } from './types';
import { useSetup } from './use-setup';
import { SetupTheme } from './components/setup-theme';
import { SetupAi } from './components/setup-ai';
import { SetupNotifications } from './components/setup-notifications';

export function SetupPage() {
  const { currentStep, stepConfig, totalSteps, isLastStep, handleNext, handleSkip, handleSkipAll } = useSetup();

  const Icon = stepConfig.icon;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div data-tauri-drag-region className="flex h-full min-h-screen flex-col items-center justify-center bg-base">
      <div className={cn('w-full px-4', currentStep === SetupStep.Theme ? 'max-w-[560px]' : 'max-w-[420px]')}>
        <div className="mb-2 flex items-center gap-3">
          <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-fg-disabled">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface">
            <Icon size={18} className="text-fg" />
          </div>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-fg">{stepConfig.title}</h1>
            <p className="mt-1 text-[13px] text-fg-muted">{stepConfig.subtitle}</p>
          </div>
        </div>

        <div className="mb-8">
          {currentStep === SetupStep.Theme && <SetupTheme />}
          {currentStep === SetupStep.Ai && <SetupAi />}
          {currentStep === SetupStep.Notifications && <SetupNotifications />}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="cursor-pointer text-[13px] text-fg-muted transition-colors hover:text-fg"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="cursor-pointer rounded-md bg-accent px-5 py-2 text-[13px] font-medium text-accent-fg transition-opacity hover:opacity-80"
          >
            {isLastStep ? 'Get Started' : 'Continue'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={handleSkipAll}
            className="cursor-pointer text-[11px] text-fg-disabled transition-colors hover:text-fg-muted"
          >
            Skip all and go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
