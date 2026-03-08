import { useState } from 'react';
import { toast } from 'sonner';
import { openai } from '@/lib/tauri';
import { useOpenAiStore } from '@/store/openai';

export function useSetupAi() {
  const setApiKey = useOpenAiStore((s) => s.setApiKey);
  const [keyInput, setKeyInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await openai.saveKey(trimmed);
      setApiKey(trimmed);
      setKeyInput('');
      setIsSaved(true);
      toast.success('API key saved');
    } catch (err) {
      toast.error(`Failed to save API key: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    keyInput,
    setKeyInput,
    isVisible,
    setIsVisible,
    isSaving,
    isSaved,
    handleSave,
  };
}
