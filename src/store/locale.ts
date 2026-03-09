import { create } from 'zustand';
import dayjs from 'dayjs';
import i18n from '@/lib/i18n';

type Language = 'en' | 'pt-BR';

const DAYJS_LOCALE: Record<Language, string> = {
  en: 'en',
  'pt-BR': 'pt-br',
};

interface LocaleState {
  language: Language;
  setLanguage: (language: Language) => void;
}

const STORAGE_KEY = 'riva_language';

function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt-BR') return 'pt-BR';
    return 'en';
  } catch {
    return 'en';
  }
}

const initialLanguage = getStoredLanguage();
dayjs.locale(DAYJS_LOCALE[initialLanguage]);

export const useLocaleStore = create<LocaleState>((set) => ({
  language: initialLanguage,

  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEY, language);
    i18n.changeLanguage(language);
    dayjs.locale(DAYJS_LOCALE[language]);
    document.documentElement.lang = language;
    set({ language });
  },
}));
