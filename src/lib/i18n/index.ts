import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEn from './locales/en/common.json';
import dashboardEn from './locales/en/dashboard.json';
import tasksEn from './locales/en/tasks.json';
import pipelinesEn from './locales/en/pipelines.json';
import pullRequestsEn from './locales/en/pull-requests.json';
import releasesEn from './locales/en/releases.json';
import settingsEn from './locales/en/settings.json';
import setupEn from './locales/en/setup.json';
import onboardingEn from './locales/en/onboarding.json';

import commonPtBR from './locales/pt-BR/common.json';
import dashboardPtBR from './locales/pt-BR/dashboard.json';
import tasksPtBR from './locales/pt-BR/tasks.json';
import pipelinesPtBR from './locales/pt-BR/pipelines.json';
import pullRequestsPtBR from './locales/pt-BR/pull-requests.json';
import releasesPtBR from './locales/pt-BR/releases.json';
import settingsPtBR from './locales/pt-BR/settings.json';
import setupPtBR from './locales/pt-BR/setup.json';
import onboardingPtBR from './locales/pt-BR/onboarding.json';

const STORAGE_KEY = 'riva_language';

function getStoredLanguage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'en';
  } catch {
    return 'en';
  }
}

export const resources = {
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    tasks: tasksEn,
    pipelines: pipelinesEn,
    'pull-requests': pullRequestsEn,
    releases: releasesEn,
    settings: settingsEn,
    setup: setupEn,
    onboarding: onboardingEn,
  },
  'pt-BR': {
    common: commonPtBR,
    dashboard: dashboardPtBR,
    tasks: tasksPtBR,
    pipelines: pipelinesPtBR,
    'pull-requests': pullRequestsPtBR,
    releases: releasesPtBR,
    settings: settingsPtBR,
    setup: setupPtBR,
    onboarding: onboardingPtBR,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'dashboard', 'tasks', 'pipelines', 'pull-requests', 'releases', 'settings', 'setup', 'onboarding'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
