import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Palette, Sparkles, Bell } from 'lucide-react';
import { Route } from '@/types/routes';
import { SetupStep } from './types';
import type { SetupStepConfig } from './types';

export const ONBOARDING_STORAGE_KEY = 'riva_onboarding_complete';

const STEP_ICONS = {
  [SetupStep.Theme]: Palette,
  [SetupStep.Ai]: Sparkles,
  [SetupStep.Notifications]: Bell,
};

const TOTAL_STEPS = Object.keys(STEP_ICONS).length;
const LAST_STEP = TOTAL_STEPS - 1;

function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

export function useSetup() {
  const { t } = useTranslation('setup');
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(SetupStep.Theme);

  const setupSteps: SetupStepConfig[] = useMemo(() => [
    { step: SetupStep.Theme, title: t('steps.theme.title'), subtitle: t('steps.theme.subtitle'), icon: STEP_ICONS[SetupStep.Theme] },
    { step: SetupStep.Ai, title: t('steps.ai.title'), subtitle: t('steps.ai.subtitle'), icon: STEP_ICONS[SetupStep.Ai] },
    { step: SetupStep.Notifications, title: t('steps.notifications.title'), subtitle: t('steps.notifications.subtitle'), icon: STEP_ICONS[SetupStep.Notifications] },
  ], [t]);

  const isLastStep = currentStep === LAST_STEP;
  const stepConfig = setupSteps[currentStep];

  const goToDashboard = () => {
    markOnboardingComplete();
    navigate(Route.Dashboard, { replace: true });
  };

  const handleAdvance = () => {
    if (isLastStep) {
      goToDashboard();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  return {
    currentStep,
    stepConfig,
    totalSteps: TOTAL_STEPS,
    isLastStep,
    handleNext: handleAdvance,
    handleSkip: handleAdvance,
    handleSkipAll: goToDashboard,
  };
}
