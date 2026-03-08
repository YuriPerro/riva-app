import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { credentials, session, openai } from '@/lib/tauri';
import { azure } from '@/lib/tauri/azure';
import { Route } from '@/types/routes';
import { useOpenAiStore } from '@/store/openai';
import { useSessionStore } from '@/store/session';

export function AuthGuard() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    credentials
      .load()
      .then(async (creds) => {
        if (!creds) return;
        await session.init(creds.orgUrl, creds.pat);
        azure.getMyUniqueName().then((name) => {
          useSessionStore.getState().setUniqueName(name);
        }).catch(console.error);
        setAuthed(true);
      })
      .finally(() => setChecked(true));

    openai.loadKey().then((key) => {
      if (key) useOpenAiStore.getState().setApiKey(key);
    });
  }, []);

  if (!checked) {
    return (
      <div data-tauri-drag-region className="flex h-screen items-center justify-center bg-base">
        <Loader2 size={16} className="animate-spin text-fg-disabled" />
      </div>
    );
  }

  return authed ? <Outlet /> : <Navigate to={Route.Onboarding} replace />;
}
