import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Route as AppRoute } from '@/types/routes';
import { AuthGuard } from './components/auth-guard';
import { LazyPage } from './components/lazy-page';

const DashboardPage = lazy(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('@/pages/tasks').then((m) => ({ default: m.TasksPage })));
const PipelinesPage = lazy(() => import('@/pages/pipelines').then((m) => ({ default: m.PipelinesPage })));
const PullRequestsPage = lazy(() => import('@/pages/pull-requests').then((m) => ({ default: m.PullRequestsPage })));
const ReleasesPage = lazy(() => import('@/pages/releases').then((m) => ({ default: m.ReleasesPage })));
const SettingsPage = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })));
const OnboardingPage = lazy(() => import('@/pages/onboarding').then((m) => ({ default: m.OnboardingPage })));
const ProjectSelectPage = lazy(() => import('@/pages/project-select').then((m) => ({ default: m.ProjectSelectPage })));
const TeamSelectPage = lazy(() => import('@/pages/team-select').then((m) => ({ default: m.TeamSelectPage })));
const SetupPage = lazy(() => import('@/pages/setup').then((m) => ({ default: m.SetupPage })));

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path={AppRoute.Onboarding}
        element={
          <LazyPage>
            <OnboardingPage />
          </LazyPage>
        }
      />
      <Route
        path={AppRoute.ProjectSelect}
        element={
          <LazyPage>
            <ProjectSelectPage />
          </LazyPage>
        }
      />
      <Route
        path={AppRoute.TeamSelect}
        element={
          <LazyPage>
            <TeamSelectPage />
          </LazyPage>
        }
      />

      <Route
        path={AppRoute.Setup}
        element={
          <LazyPage>
            <SetupPage />
          </LazyPage>
        }
      />

      <Route path={AppRoute.Dashboard} element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route
            index
            element={
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            }
          />
          <Route
            path="tasks"
            element={
              <LazyPage>
                <TasksPage />
              </LazyPage>
            }
          />
          <Route
            path="pipelines"
            element={
              <LazyPage>
                <PipelinesPage />
              </LazyPage>
            }
          />
          <Route
            path="pull-requests"
            element={
              <LazyPage>
                <PullRequestsPage />
              </LazyPage>
            }
          />
          <Route
            path="releases"
            element={
              <LazyPage>
                <ReleasesPage />
              </LazyPage>
            }
          />
          <Route
            path="settings"
            element={
              <LazyPage>
                <SettingsPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
