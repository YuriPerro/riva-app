import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { credentials, session } from '@/lib/tauri';
import { Route } from '@/types/routes';

export function AuthGuard() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    credentials
      .load()
      .then(async (creds) => {
        if (!creds) return;
        await session.init(creds.orgUrl, creds.pat);
        setAuthed(true);
      })
      .finally(() => setChecked(true));
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
