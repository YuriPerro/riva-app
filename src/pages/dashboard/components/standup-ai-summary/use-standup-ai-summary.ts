import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { openai } from '@/lib/tauri';
import { useLocaleStore } from '@/store/locale';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  'pt-BR': 'Brazilian Portuguese',
};

export function useStandupAiSummary(clipboardText: string) {
  const { t } = useTranslation('dashboard');
  const language = useLocaleStore((s) => s.language);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!clipboardText) return;
    setIsGenerating(true);
    setSummary(null);
    try {
      const langName = LANGUAGE_NAMES[language] ?? 'English';
      const prompt = language === 'en'
        ? clipboardText
        : `[IMPORTANT: Write your entire response in ${langName}]\n\n${clipboardText}`;
      const result = await openai.generateStandup(prompt);
      setSummary(result);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsGenerating(false);
    }
  }, [clipboardText, language]);

  const handleCopy = useCallback(async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success(t('aiSummary.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [summary]);

  const togglePrompt = useCallback(() => {
    setShowPrompt((v) => !v);
  }, []);

  return {
    summary,
    isGenerating,
    showPrompt,
    copied,
    handleGenerate,
    handleCopy,
    togglePrompt,
  };
}
