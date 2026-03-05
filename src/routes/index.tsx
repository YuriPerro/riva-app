import { useEffect, useState } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { DashboardPage } from "@/pages/dashboard";
import { MyWorkPage } from "@/pages/my-work";
import { PipelinesPage } from "@/pages/pipelines";
import { PullRequestsPage } from "@/pages/pull-requests";
import { SettingsPage } from "@/pages/settings";
import { OnboardingPage } from "@/pages/onboarding";
import { ProjectSelectPage } from "@/pages/project-select";
import { TeamSelectPage } from "@/pages/team-select";
import { credentials, session } from "@/lib/tauri";

function AuthGuard() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    credentials.load()
      .then(async (creds) => {
        if (!creds) return;
        await session.init(creds.orgUrl, creds.pat);
        setAuthed(true);
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div
        data-tauri-drag-region
        className="flex h-screen items-center justify-center bg-base"
      >
        <Loader2 size={16} className="animate-spin text-fg-disabled" />
      </div>
    );
  }

  return authed ? <Outlet /> : <Navigate to="/onboarding" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/project-select",
    element: <ProjectSelectPage />,
  },
  {
    path: "/team-select",
    element: <TeamSelectPage />,
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "my-work", element: <MyWorkPage /> },
          { path: "pipelines", element: <PipelinesPage /> },
          { path: "pull-requests", element: <PullRequestsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
