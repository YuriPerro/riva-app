import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { azure } from '@/lib/tauri';
import type { PullRequest as ApiPullRequest } from '@/types/azure';
import { Route } from '@/types/routes';
import { useSessionStore } from '@/store/session';
import { formatAgo, formatBuildReason, formatDuration, getAssigneeInitials, initials, stripRefs } from '@/utils/formatters';
import { mapWorkItemType, mapWorkItemStatus, mapPipelineStatus } from '@/utils/mappers';
import type { WorkItem, Pipeline, DashboardPR, SprintInfo, DashboardData } from './types';

function mapSprintStatus(days: number): SprintInfo['status'] {
  if (days <= 2) return 'at-risk';
  return 'on-track';
}

function mapPullRequest(pr: ApiPullRequest): DashboardPR {
  const name = pr.createdBy.displayName ?? '';
  const approvedCount = pr.reviewers.filter((r) => r.vote === 10).length;

  return {
    id: pr.pullRequestId,
    title: pr.title,
    repo: pr.repository.name,
    sourceBranch: stripRefs(pr.sourceRefName),
    targetBranch: stripRefs(pr.targetRefName),
    author: name,
    authorInitials: initials(name) || '?',
    createdAgo: formatAgo(pr.creationDate),
    status: pr.isDraft ? 'draft' : 'active',
    reviewerCount: pr.reviewers.length,
    approvedCount,
    url: pr.webUrl,
  };
}

async function fetchDashboardData(project: string, team: string, teamId: string) {
  const [sprintData, rawItems, rawPipelines, rawPRs] = await Promise.all([
    azure.getCurrentSprint(project, team),
    azure.getTasks(project, team),
    azure.getRecentPipelines(project, teamId),
    azure.getPullRequests(project),
  ]);

  const sprint: SprintInfo | null = sprintData
    ? (() => {
        const finishDate = sprintData.attributes.finishDate;
        const startDate = sprintData.attributes.startDate;
        const days = finishDate ? Math.max(0, dayjs(finishDate).diff(dayjs(), 'day', true)) : 0;
        const daysRemaining = Math.ceil(days);
        const totalDays = startDate && finishDate ? Math.max(1, Math.ceil(dayjs(finishDate).diff(dayjs(startDate), 'day', true))) : 0;
        return {
          name: sprintData.name,
          daysRemaining,
          totalDays,
          startDate: startDate ?? '',
          status: mapSprintStatus(daysRemaining),
        };
      })()
    : null;

  const workItems: WorkItem[] = rawItems.map((w) => ({
    id: w.id,
    title: w.fields['System.Title'],
    type: mapWorkItemType(w.fields['System.WorkItemType']),
    status: mapWorkItemStatus(w.fields['System.State']),
    assigneeInitials: getAssigneeInitials(w.fields['System.AssignedTo'] as { displayName: string } | null),
    iterationPath: w.fields['System.IterationPath'],
    url: w.webUrl,
  }));

  const pipelines: Pipeline[] = rawPipelines.map((p) => ({
    id: p.id,
    name: p.definition.name,
    branch: stripRefs(p.sourceBranch),
    target: formatBuildReason(p.reason),
    status: mapPipelineStatus(p),
    duration: formatDuration(p.queueTime, p.finishTime),
    ago: formatAgo(p.finishTime ?? p.queueTime),
    url: p.webUrl,
  }));

  const pullRequests: DashboardPR[] = rawPRs.map(mapPullRequest);

  return { sprint, workItems, pipelines, pullRequests };
}

export const useDashboard = (): DashboardData => {
  const navigate = useNavigate();
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);
  const teamId = useSessionStore((s) => s.teamId);

  useEffect(() => {
    if (!project) {
      navigate(Route.ProjectSelect, { replace: true });
    } else if (!team) {
      navigate(Route.TeamSelect, { replace: true });
    }
  }, [project, team, navigate]);

  const enabled = !!project && !!team;

  const [selectedWorkItemId, setSelectedWorkItemId] = useState<number | null>(null);
  const [standupPeriod, setStandupPeriod] = useState<number>(1);
  const [standupOpen, setStandupOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', project, team, teamId],
    queryFn: () => fetchDashboardData(project!, team!, teamId ?? ''),
    enabled,
    refetchInterval: 30_000,
  });

  const standupQuery = useQuery({
    queryKey: ['standup', project, team, standupPeriod],
    queryFn: () => azure.getStandupData(project!, team ?? undefined, standupPeriod),
    enabled,
    staleTime: 300_000,
    refetchInterval: false,
  });

  const stats = useMemo(
    () => ({
      myTasks: data?.workItems.length ?? 0,
      inReview: data?.workItems.filter((w) => w.status === 'in-review').length ?? 0,
      pipelinesRunning: data?.pipelines.filter((p) => p.status === 'running').length ?? 0,
      openPRs: data?.pullRequests.length ?? 0,
    }),
    [data?.workItems, data?.pipelines, data?.pullRequests],
  );

  return {
    project,
    sprint: data?.sprint ?? null,
    stats,
    workItems: data?.workItems ?? [],
    pipelines: data?.pipelines ?? [],
    pullRequests: data?.pullRequests ?? [],
    isLoading: enabled && isLoading,
    error: error ? (typeof error === 'string' ? error : 'Failed to load dashboard data') : null,
    selectedWorkItemId,
    selectWorkItem: setSelectedWorkItemId,
    closeWorkItemDetail: () => setSelectedWorkItemId(null),
    standup: standupQuery.data ?? null,
    standupLoading: enabled && standupQuery.isLoading,
    standupPeriod,
    setStandupPeriod,
    standupOpen,
    setStandupOpen,
  };
};
