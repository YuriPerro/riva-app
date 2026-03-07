import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { openai } from '@/lib/tauri';

export function useStandupAiSummary(clipboardText: string) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!clipboardText) return;
    setIsGenerating(true);
    setSummary(null);
    try {
      const result = await openai.generateStandup(clipboardText);
      setSummary(result);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsGenerating(false);
    }
  }, [clipboardText]);

  const handleCopy = useCallback(async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('AI summary copied');
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
