import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useBranchField(branch: string) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(branch);
    setCopied(true);
    toast.success('Branch name copied');
    setTimeout(() => setCopied(false), 2000);
  }, [branch]);

  return { copied, handleCopy };
}
