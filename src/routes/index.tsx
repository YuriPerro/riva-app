import { lazy, Suspense, useEffect, useState } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { credentials, session } from "@/lib/tauri";
import { Route } from "@/types/routes";

const DashboardPage = lazy(() => import("@/pages/dashboard").then((m) => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import("@/pages/tasks").then((m) => ({ default: m.TasksPage })));
const PipelinesPage = lazy(() => import("@/pages/pipelines").then((m) => ({ default: m.PipelinesPage })));
const PullRequestsPage = lazy(() => import("@/pages/pull-requests").then((m) => ({ default: m.PullRequestsPage })));
const SettingsPage = lazy(() => import("@/pages/settings").then((m) => ({ default: m.SettingsPage })));
const OnboardingPage = lazy(() => import("@/pages/onboarding").then((m) => ({ default: m.OnboardingPage })));
const ProjectSelectPage = lazy(() => import("@/pages/project-select").then((m) => ({ default: m.ProjectSelectPage })));
const TeamSelectPage = lazy(() => import("@/pages/team-select").then((m) => ({ default: m.TeamSelectPage })));

function PageFallback() {
  return (
    <div
      data-tauri-drag-region
      className="flex h-full items-center justify-center"
    >
      <Loader2 size={16} className="animate-spin text-fg-disabled" />
    </div>
  );
}

function LazyPage(props: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{props.children}</Suspense>;
}

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

  return authed ? <Outlet /> : <Navigate to={Route.Onboarding} replace />;
}

export const router = createBrowserRouter([
  {
    path: Route.Onboarding,
    element: <LazyPage><OnboardingPage /></LazyPage>,
  },
  {
    path: Route.ProjectSelect,
    element: <LazyPage><ProjectSelectPage /></LazyPage>,
  },
  {
    path: Route.TeamSelect,
    element: <LazyPage><TeamSelectPage /></LazyPage>,
  },
  {
    path: Route.Dashboard,
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <LazyPage><DashboardPage /></LazyPage> },
          { path: "tasks", element: <LazyPage><TasksPage /></LazyPage> },
          { path: "pipelines", element: <LazyPage><PipelinesPage /></LazyPage> },
          { path: "pull-requests", element: <LazyPage><PullRequestsPage /></LazyPage> },
          { path: "settings", element: <LazyPage><SettingsPage /></LazyPage> },
        ],
      },
    ],
  },
]);
