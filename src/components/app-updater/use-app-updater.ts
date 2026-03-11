import { useState, useEffect, useCallback } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import type { UpdateStatus } from './types';

export function useAppUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [version, setVersion] = useState('');
  const [update, setUpdate] = useState<Update | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      try {
        setStatus('checking');
        const result = await check();

        if (cancelled) return;

        if (result) {
          setUpdate(result);
          setVersion(result.version);
          setStatus('available');
        } else {
          setStatus('idle');
        }
      } catch {
        if (!cancelled) setStatus('idle');
      }
    }

    checkForUpdate();
    return () => { cancelled = true; };
  }, []);

  const install = useCallback(async () => {
    if (!update) return;

    try {
      setStatus('downloading');
      await update.downloadAndInstall();
      await relaunch();
    } catch {
      setStatus('error');
    }
  }, [update]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const showBanner = status === 'available' && !dismissed;

  return {
    status,
    version,
    showBanner,
    install,
    dismiss,
  };
}
