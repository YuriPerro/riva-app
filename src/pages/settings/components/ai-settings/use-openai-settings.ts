import { useState } from 'react';
import { toast } from 'sonner';
import { openai } from '@/lib/tauri';
import { useOpenAiStore } from '@/store/openai';

export function useAiSettings() {
  const { apiKey, setApiKey, clearApiKey } = useOpenAiStore();
  const [keyInput, setKeyInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const hasKey = !!apiKey;
  const maskedKey = apiKey ? `${'•'.repeat(12)}${apiKey.slice(-4)}` : '';

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await openai.saveKey(trimmed);
      setApiKey(trimmed);
      setKeyInput('');
      toast.success('API key saved');
    } catch (err) {
      toast.error(`Failed to save API key: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await openai.clearKey();
      clearApiKey();
      toast.success('API key removed');
    } catch (err) {
      toast.error(`Failed to remove API key: ${err}`);
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    hasKey,
    maskedKey,
    keyInput,
    setKeyInput,
    isVisible,
    setIsVisible,
    isSaving,
    isRemoving,
    handleSave,
    handleRemove,
  };
}
