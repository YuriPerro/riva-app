import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { DashboardPage } from "@/pages/dashboard";
import { MyWorkPage } from "@/pages/my-work";
import { PipelinesPage } from "@/pages/pipelines";
import { PullRequestsPage } from "@/pages/pull-requests";
import { SettingsPage } from "@/pages/settings";
import { OnboardingPage } from "@/pages/onboarding";

export const router = createBrowserRouter([
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "my-work", element: <MyWorkPage /> },
      { path: "pipelines", element: <PipelinesPage /> },
      { path: "pull-requests", element: <PullRequestsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
