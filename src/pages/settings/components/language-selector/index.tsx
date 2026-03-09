import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/store/locale';
import type { LanguageOption } from './types';

export function LanguageSelector() {
  const { t } = useTranslation('settings');
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);

  const options: LanguageOption[] = useMemo(
    () => [
      { value: 'en', label: t('language.en'), flag: '🇺🇸' },
      { value: 'pt-BR', label: t('language.pt-BR'), flag: '🇧🇷' },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-accent" />
          <span className="text-sm font-medium text-fg">{t('language.title')}</span>
        </div>
        <span className="text-xs text-fg-muted">{t('language.description')}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-left text-xs transition-colors',
              language === option.value
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border text-fg-muted hover:bg-elevated hover:text-fg',
            )}
          >
            <span className="text-base leading-none">{option.flag}</span>
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
