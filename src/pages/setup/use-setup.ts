import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Sparkles, Bell } from 'lucide-react';
import { Route } from '@/types/routes';
import { SetupStep } from './types';
import type { SetupStepConfig } from './types';

export const ONBOARDING_STORAGE_KEY = 'forge_onboarding_complete';

const SETUP_STEPS: SetupStepConfig[] = [
  { step: SetupStep.Theme, title: 'Choose your theme', subtitle: 'Pick a visual style that feels right', icon: Palette },
  { step: SetupStep.Ai, title: 'AI summaries', subtitle: 'Generate standup summaries with OpenAI', icon: Sparkles },
  { step: SetupStep.Notifications, title: 'Notifications', subtitle: 'Stay on top of what matters', icon: Bell },
];

const TOTAL_STEPS = SETUP_STEPS.length;
const LAST_STEP = TOTAL_STEPS - 1;

function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

export function useSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(SetupStep.Theme);

  const isLastStep = currentStep === LAST_STEP;
  const stepConfig = SETUP_STEPS[currentStep];

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
