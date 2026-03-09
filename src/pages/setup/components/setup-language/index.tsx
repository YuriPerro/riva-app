import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/store/locale';

const LANGUAGES = [
  { value: 'en' as const, label: 'English', flag: '🇺🇸', native: 'English' },
  { value: 'pt-BR' as const, label: 'Português (Brasil)', flag: '🇧🇷', native: 'Portuguese' },
];

export function SetupLanguage() {
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);

  return (
    <div className="flex flex-col gap-2.5">
      {LANGUAGES.map((lang) => {
        const active = language === lang.value;
        return (
          <button
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className={cn(
              'group relative flex cursor-pointer items-center gap-4 rounded-lg border px-5 py-4 text-left transition-all',
              active
                ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                : 'border-border hover:border-fg-disabled hover:bg-elevated',
            )}
          >
            <span className="text-3xl leading-none">{lang.flag}</span>
            <div className="flex flex-col gap-0.5">
              <span className={cn('text-[14px] font-medium', active ? 'text-accent' : 'text-fg')}>
                {lang.label}
              </span>
              <span className="text-[12px] text-fg-muted">{lang.native}</span>
            </div>
            {active && (
              <div className="ml-auto h-2.5 w-2.5 rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
