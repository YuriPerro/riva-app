import type {
  Project,
  Team,
  WorkItem,
  PipelineRun,
  PipelineDefinition,
  PullRequest,
  SprintIteration,
  StandupData,
  RelatedWorkItem,
  ReleaseDefinition,
  Release,
  UserActivitySummary,
  WorkItemComment,
} from '@/types/azure';

export const projects: Project[] = [
  { id: 'proj-001', name: 'Acme Corp', description: 'Main product platform' },
  { id: 'proj-002', name: 'Acme Internal Tools', description: 'Internal tooling and automation' },
];

export const teams: Team[] = [
  { id: 'team-001', name: 'Frontend Squad' },
  { id: 'team-002', name: 'Backend Guild' },
  { id: 'team-003', name: 'Platform & Infra' },
];

export const currentSprint: SprintIteration = {
  id: 'sprint-012',
  name: 'Sprint 12',
  path: 'Acme Corp\\Sprint 12',
  attributes: {
    startDate: '2026-03-17T00:00:00Z',
    finishDate: '2026-03-28T00:00:00Z',
    timeFrame: 'current',
  },
};

export const sprints: SprintIteration[] = [
  {
    id: 'sprint-010',
    name: 'Sprint 10',
    path: 'Acme Corp\\Sprint 10',
    attributes: {
      startDate: '2026-02-17T00:00:00Z',
      finishDate: '2026-02-28T00:00:00Z',
      timeFrame: 'past',
    },
  },
  {
    id: 'sprint-011',
    name: 'Sprint 11',
    path: 'Acme Corp\\Sprint 11',
    attributes: {
      startDate: '2026-03-03T00:00:00Z',
      finishDate: '2026-03-14T00:00:00Z',
      timeFrame: 'past',
    },
  },
  currentSprint,
  {
    id: 'sprint-013',
    name: 'Sprint 13',
    path: 'Acme Corp\\Sprint 13',
    attributes: {
      startDate: '2026-03-31T00:00:00Z',
      finishDate: '2026-04-11T00:00:00Z',
      timeFrame: 'future',
    },
  },
];

const BASE_URL = 'https://dev.azure.com/acmecorp/Acme%20Corp';

export const workItems: WorkItem[] = [
  {
    id: 4201,
    fields: {
      'System.Title': 'Implement dark mode toggle',
      'System.WorkItemType': 'Task',
      'System.State': 'Active',
      'System.AssignedTo': { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4200,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4201`,
  },
  {
    id: 4202,
    fields: {
      'System.Title': 'Fix login redirect loop on expired tokens',
      'System.WorkItemType': 'Bug',
      'System.State': 'Active',
      'System.AssignedTo': { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': null,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4202`,
  },
  {
    id: 4203,
    fields: {
      'System.Title': 'Add pagination to user list endpoint',
      'System.WorkItemType': 'Task',
      'System.State': 'In Review',
      'System.AssignedTo': { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4200,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4203`,
  },
  {
    id: 4204,
    fields: {
      'System.Title': 'Refactor notification service for WebSocket support',
      'System.WorkItemType': 'Task',
      'System.State': 'Closed',
      'System.AssignedTo': { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4210,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4204`,
  },
  {
    id: 4205,
    fields: {
      'System.Title': 'Write E2E tests for checkout flow',
      'System.WorkItemType': 'Task',
      'System.State': 'New',
      'System.AssignedTo': { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4200,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4205`,
  },
  {
    id: 4200,
    fields: {
      'System.Title': 'User settings redesign',
      'System.WorkItemType': 'Product Backlog Item',
      'System.State': 'Active',
      'System.AssignedTo': { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4199,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4200`,
  },
  {
    id: 4199,
    fields: {
      'System.Title': 'Q1 User Experience Improvements',
      'System.WorkItemType': 'Feature',
      'System.State': 'Active',
      'System.AssignedTo': { displayName: 'Alex Chen', uniqueName: 'alex.chen@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': null,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4199`,
  },
  {
    id: 4206,
    fields: {
      'System.Title': 'Dropdown menu closes immediately on mobile Safari',
      'System.WorkItemType': 'Bug',
      'System.State': 'New',
      'System.AssignedTo': { displayName: 'Maria Santos', uniqueName: 'maria.santos@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': null,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4206`,
  },
  {
    id: 4207,
    fields: {
      'System.Title': 'Integrate Stripe billing portal',
      'System.WorkItemType': 'Task',
      'System.State': 'Active',
      'System.AssignedTo': { displayName: 'Jake Miller', uniqueName: 'jake.miller@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4210,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4207`,
  },
  {
    id: 4208,
    fields: {
      'System.Title': 'Update API rate limiting middleware',
      'System.WorkItemType': 'Task',
      'System.State': 'Closed',
      'System.AssignedTo': { displayName: 'Sarah Kim', uniqueName: 'sarah.kim@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4210,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4208`,
  },
  {
    id: 4210,
    fields: {
      'System.Title': 'Platform reliability improvements',
      'System.WorkItemType': 'Product Backlog Item',
      'System.State': 'Active',
      'System.AssignedTo': { displayName: 'Jake Miller', uniqueName: 'jake.miller@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': null,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4210`,
  },
  {
    id: 4209,
    fields: {
      'System.Title': 'Optimize dashboard query performance',
      'System.WorkItemType': 'Task',
      'System.State': 'In Review',
      'System.AssignedTo': { displayName: 'Sarah Kim', uniqueName: 'sarah.kim@acmecorp.dev' },
      'System.IterationPath': 'Acme Corp\\Sprint 12',
      'System.Parent': 4210,
    },
    webUrl: `${BASE_URL}/_workitems/edit/4209`,
  },
];

export const pipelineDefinitions: PipelineDefinition[] = [
  { id: 10, name: 'acme-web-ci' },
  { id: 11, name: 'acme-api-ci' },
  { id: 12, name: 'acme-e2e-tests' },
  { id: 13, name: 'acme-infra-deploy' },
];

export const pipelineRuns: PipelineRun[] = [
  {
    id: 8501,
    buildNumber: '20260322.1',
    status: 'completed',
    result: 'succeeded',
    sourceBranch: 'refs/heads/feat/dark-mode',
    reason: 'individualCI',
    queueTime: '2026-03-22T09:15:00Z',
    finishTime: '2026-03-22T09:19:42Z',
    definition: { id: 10, name: 'acme-web-ci' },
    webUrl: `${BASE_URL}/_build/results?buildId=8501`,
  },
  {
    id: 8500,
    buildNumber: '20260322.2',
    status: 'inProgress',
    sourceBranch: 'refs/heads/feat/billing-portal',
    reason: 'individualCI',
    queueTime: '2026-03-22T09:22:00Z',
    definition: { id: 11, name: 'acme-api-ci' },
    webUrl: `${BASE_URL}/_build/results?buildId=8500`,
  },
  {
    id: 8499,
    buildNumber: '20260321.4',
    status: 'completed',
    result: 'failed',
    sourceBranch: 'refs/heads/fix/login-redirect',
    reason: 'individualCI',
    queueTime: '2026-03-21T17:45:00Z',
    finishTime: '2026-03-21T17:48:30Z',
    definition: { id: 12, name: 'acme-e2e-tests' },
    webUrl: `${BASE_URL}/_build/results?buildId=8499`,
  },
  {
    id: 8498,
    buildNumber: '20260321.3',
    status: 'completed',
    result: 'succeeded',
    sourceBranch: 'refs/heads/main',
    reason: 'individualCI',
    queueTime: '2026-03-21T14:30:00Z',
    finishTime: '2026-03-21T14:36:15Z',
    definition: { id: 10, name: 'acme-web-ci' },
    webUrl: `${BASE_URL}/_build/results?buildId=8498`,
  },
  {
    id: 8497,
    buildNumber: '20260321.2',
    status: 'completed',
    result: 'succeeded',
    sourceBranch: 'refs/heads/feat/user-pagination',
    reason: 'pullRequest',
    queueTime: '2026-03-21T11:00:00Z',
    finishTime: '2026-03-21T11:04:50Z',
    definition: { id: 11, name: 'acme-api-ci' },
    triggerInfo: { 'pr.number': '312' },
    webUrl: `${BASE_URL}/_build/results?buildId=8497`,
  },
  {
    id: 8496,
    buildNumber: '20260320.1',
    status: 'completed',
    result: 'succeeded',
    sourceBranch: 'refs/heads/main',
    reason: 'manual',
    queueTime: '2026-03-20T16:00:00Z',
    finishTime: '2026-03-20T16:12:30Z',
    definition: { id: 13, name: 'acme-infra-deploy' },
    webUrl: `${BASE_URL}/_build/results?buildId=8496`,
  },
];

export const pullRequests: PullRequest[] = [
  {
    pullRequestId: 314,
    title: 'feat: implement dark mode toggle with system preference detection',
    sourceRefName: 'refs/heads/feat/dark-mode',
    targetRefName: 'refs/heads/main',
    createdBy: { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
    creationDate: '2026-03-21T10:30:00Z',
    status: 'active',
    repository: { id: 'repo-001', name: 'acme-web' },
    isDraft: false,
    reviewers: [
      { displayName: 'Alex Chen', uniqueName: 'alex.chen@acmecorp.dev', vote: 10, isRequired: true },
      { displayName: 'Maria Santos', uniqueName: 'maria.santos@acmecorp.dev', vote: 5, isRequired: false },
    ],
    webUrl: `${BASE_URL}/_git/acme-web/pullrequest/314`,
  },
  {
    pullRequestId: 312,
    title: 'feat: add cursor-based pagination to /api/users',
    sourceRefName: 'refs/heads/feat/user-pagination',
    targetRefName: 'refs/heads/main',
    createdBy: { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
    creationDate: '2026-03-20T14:00:00Z',
    status: 'active',
    repository: { id: 'repo-002', name: 'acme-api' },
    isDraft: false,
    reviewers: [
      { displayName: 'Jake Miller', uniqueName: 'jake.miller@acmecorp.dev', vote: 0, isRequired: true },
      { displayName: 'Sarah Kim', uniqueName: 'sarah.kim@acmecorp.dev', vote: 10, isRequired: true },
    ],
    webUrl: `${BASE_URL}/_git/acme-api/pullrequest/312`,
  },
  {
    pullRequestId: 315,
    title: 'fix: resolve token refresh race condition on login redirect',
    sourceRefName: 'refs/heads/fix/login-redirect',
    targetRefName: 'refs/heads/main',
    createdBy: { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
    creationDate: '2026-03-22T08:15:00Z',
    status: 'active',
    repository: { id: 'repo-002', name: 'acme-api' },
    isDraft: true,
    reviewers: [],
    webUrl: `${BASE_URL}/_git/acme-api/pullrequest/315`,
  },
  {
    pullRequestId: 310,
    title: 'feat: integrate Stripe billing portal with subscription management',
    sourceRefName: 'refs/heads/feat/billing-portal',
    targetRefName: 'refs/heads/main',
    createdBy: { displayName: 'Jake Miller', uniqueName: 'jake.miller@acmecorp.dev' },
    creationDate: '2026-03-19T09:00:00Z',
    status: 'active',
    repository: { id: 'repo-002', name: 'acme-api' },
    isDraft: false,
    reviewers: [
      { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev', vote: 5, isRequired: true },
      { displayName: 'Alex Chen', uniqueName: 'alex.chen@acmecorp.dev', vote: 0, isRequired: false },
    ],
    webUrl: `${BASE_URL}/_git/acme-api/pullrequest/310`,
  },
];

export const standupData: StandupData = {
  transitions: [
    {
      workItemId: 4201,
      title: 'Implement dark mode toggle',
      workItemType: 'Task',
      fromState: 'New',
      toState: 'Active',
      changedDate: '2026-03-22T09:00:00Z',
      webUrl: `${BASE_URL}/_workitems/edit/4201`,
    },
    {
      workItemId: 4204,
      title: 'Refactor notification service for WebSocket support',
      workItemType: 'Task',
      fromState: 'In Review',
      toState: 'Closed',
      changedDate: '2026-03-21T16:30:00Z',
      webUrl: `${BASE_URL}/_workitems/edit/4204`,
    },
    {
      workItemId: 4203,
      title: 'Add pagination to user list endpoint',
      workItemType: 'Task',
      fromState: 'Active',
      toState: 'In Review',
      changedDate: '2026-03-21T14:00:00Z',
      webUrl: `${BASE_URL}/_workitems/edit/4203`,
    },
  ],
  today: [
    {
      id: 4201,
      title: 'Implement dark mode toggle',
      workItemType: 'Task',
      state: 'Active',
      webUrl: `${BASE_URL}/_workitems/edit/4201`,
    },
    {
      id: 4202,
      title: 'Fix login redirect loop on expired tokens',
      workItemType: 'Bug',
      state: 'Active',
      webUrl: `${BASE_URL}/_workitems/edit/4202`,
    },
  ],
  todayPrs: [
    {
      id: 314,
      title: 'feat: implement dark mode toggle with system preference detection',
      repo: 'acme-web',
      activityType: 'created',
      webUrl: `${BASE_URL}/_git/acme-web/pullrequest/314`,
    },
    {
      id: 312,
      title: 'feat: add cursor-based pagination to /api/users',
      repo: 'acme-api',
      activityType: 'reviewed',
      webUrl: `${BASE_URL}/_git/acme-api/pullrequest/312`,
    },
  ],
  blockers: [
    {
      id: 4202,
      title: 'Fix login redirect loop on expired tokens',
      workItemType: 'Bug',
      state: 'Active',
      webUrl: `${BASE_URL}/_workitems/edit/4202`,
    },
  ],
};

export const standupSummary =
  `**Yesterday:**\n` +
  `- Moved "Refactor notification service for WebSocket support" to Closed\n` +
  `- Moved "Add pagination to user list endpoint" to In Review (PR #312 open)\n\n` +
  `**Today:**\n` +
  `- Working on dark mode toggle implementation (PR #314 created, approved by Alex)\n` +
  `- Investigating login redirect bug with expired token handling\n\n` +
  `**Blockers:**\n` +
  `- Login redirect loop (#4202) blocking release — needs auth team input on token refresh strategy`;

export const myUniqueName = 'yuri@acmecorp.dev';

export const userActivity: UserActivitySummary = {
  activeDates: [
    '2026-03-20',
    '2026-03-19',
    '2026-03-18',
    '2026-03-17',
    '2026-03-16',
    '2026-03-13',
    '2026-03-12',
    '2026-03-11',
    '2026-03-10',
    '2026-03-09',
  ],
  thisWeekCount: 6,
  lastWeekCount: 5,
};

export const relatedWorkItems: RelatedWorkItem[] = [
  { id: 4200, title: 'User settings redesign', workItemType: 'Product Backlog Item', state: 'Active', webUrl: `${BASE_URL}/_workitems/edit/4200` },
  { id: 4199, title: 'Q1 User Experience Improvements', workItemType: 'Feature', state: 'Active', webUrl: `${BASE_URL}/_workitems/edit/4199` },
  { id: 4210, title: 'Platform reliability improvements', workItemType: 'Product Backlog Item', state: 'Active', webUrl: `${BASE_URL}/_workitems/edit/4210` },
];

export const comments: WorkItemComment[] = [
  {
    workItemId: 4201,
    workItemTitle: 'Implement dark mode toggle',
    commentId: 9001,
    text: 'Should we persist the preference in localStorage or sync it to the user profile API?',
    createdBy: 'Alex Chen',
    createdDate: '2026-03-22T10:15:00Z',
  },
  {
    workItemId: 4202,
    workItemTitle: 'Fix login redirect loop on expired tokens',
    commentId: 9002,
    text: 'Reproduced this on Chrome and Firefox. The refresh token call returns 401 and triggers an infinite redirect. Needs a max-retry guard.',
    createdBy: 'Maria Santos',
    createdDate: '2026-03-21T15:45:00Z',
  },
  {
    workItemId: 4203,
    workItemTitle: 'Add pagination to user list endpoint',
    commentId: 9003,
    text: 'Cursor-based approach looks good. Left a few comments on the PR about edge cases with deleted users.',
    createdBy: 'Sarah Kim',
    createdDate: '2026-03-21T12:30:00Z',
  },
];

export const releaseDefinitions: ReleaseDefinition[] = [
  {
    id: 50,
    name: 'Acme Web Production',
    environments: [
      { name: 'Staging', rank: 1 },
      { name: 'Production', rank: 2 },
    ],
  },
  {
    id: 51,
    name: 'Acme API Production',
    environments: [
      { name: 'QA', rank: 1 },
      { name: 'Staging', rank: 2 },
      { name: 'Production', rank: 3 },
    ],
  },
  {
    id: 52,
    name: 'Acme Mobile Backend',
    environments: [
      { name: 'Dev', rank: 1 },
      { name: 'Staging', rank: 2 },
      { name: 'Production', rank: 3 },
    ],
  },
];

export const releases: Release[] = [
  {
    id: 710,
    name: 'Release-710',
    releaseDefinition: { id: 50, name: 'Acme Web Production' },
    createdBy: { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
    createdOn: '2026-03-22T11:00:00Z',
    environments: [
      {
        name: 'Staging',
        rank: 1,
        status: 'inProgress',
        deploySteps: [{ lastModifiedOn: '2026-03-22T11:05:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Production',
        rank: 2,
        status: 'notStarted',
        deploySteps: [],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
    ],
    webUrl: `${BASE_URL}/_releaseProgress?_a=release-pipeline-progress&releaseId=710`,
  },
  {
    id: 709,
    name: 'Release-709',
    releaseDefinition: { id: 51, name: 'Acme API Production' },
    createdBy: { displayName: 'Alex Chen', uniqueName: 'alex.chen@acmecorp.dev' },
    createdOn: '2026-03-21T16:00:00Z',
    environments: [
      {
        name: 'QA',
        rank: 1,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-21T16:12:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Staging',
        rank: 2,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-21T17:00:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Production',
        rank: 3,
        status: 'notStarted',
        deploySteps: [],
        preDeployApprovals: [
          {
            id: 3010,
            status: 'pending',
            approvalType: 'preDeploy',
            approver: { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
            createdOn: '2026-03-21T17:01:00Z',
          },
        ],
        postDeployApprovals: [],
      },
    ],
    webUrl: `${BASE_URL}/_releaseProgress?_a=release-pipeline-progress&releaseId=709`,
  },
  {
    id: 708,
    name: 'Release-708',
    releaseDefinition: { id: 52, name: 'Acme Mobile Backend' },
    createdBy: { displayName: 'Maria Santos', uniqueName: 'maria.santos@acmecorp.dev' },
    createdOn: '2026-03-21T10:30:00Z',
    environments: [
      {
        name: 'Dev',
        rank: 1,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-21T10:38:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Staging',
        rank: 2,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-21T11:00:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Production',
        rank: 3,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-21T14:00:00Z' }],
        preDeployApprovals: [
          {
            id: 3008,
            status: 'approved',
            approvalType: 'preDeploy',
            approver: { displayName: 'Jake Miller', uniqueName: 'jake.miller@acmecorp.dev' },
            createdOn: '2026-03-21T13:30:00Z',
            modifiedOn: '2026-03-21T13:45:00Z',
          },
        ],
        postDeployApprovals: [],
      },
    ],
    webUrl: `${BASE_URL}/_releaseProgress?_a=release-pipeline-progress&releaseId=708`,
  },
  {
    id: 707,
    name: 'Release-707',
    releaseDefinition: { id: 50, name: 'Acme Web Production' },
    createdBy: { displayName: 'Sarah Kim', uniqueName: 'sarah.kim@acmecorp.dev' },
    createdOn: '2026-03-20T15:00:00Z',
    environments: [
      {
        name: 'Staging',
        rank: 1,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-20T15:10:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Production',
        rank: 2,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-20T16:30:00Z' }],
        preDeployApprovals: [
          {
            id: 3005,
            status: 'approved',
            approvalType: 'preDeploy',
            approver: { displayName: 'Alex Chen', uniqueName: 'alex.chen@acmecorp.dev' },
            createdOn: '2026-03-20T16:00:00Z',
            modifiedOn: '2026-03-20T16:15:00Z',
          },
        ],
        postDeployApprovals: [],
      },
    ],
    webUrl: `${BASE_URL}/_releaseProgress?_a=release-pipeline-progress&releaseId=707`,
  },
  {
    id: 706,
    name: 'Release-706',
    releaseDefinition: { id: 51, name: 'Acme API Production' },
    createdBy: { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
    createdOn: '2026-03-20T09:00:00Z',
    environments: [
      {
        name: 'QA',
        rank: 1,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-20T09:10:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Staging',
        rank: 2,
        status: 'failed',
        deploySteps: [{ lastModifiedOn: '2026-03-20T09:25:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Production',
        rank: 3,
        status: 'notStarted',
        deploySteps: [],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
    ],
    webUrl: `${BASE_URL}/_releaseProgress?_a=release-pipeline-progress&releaseId=706`,
  },
  {
    id: 705,
    name: 'Release-705',
    releaseDefinition: { id: 52, name: 'Acme Mobile Backend' },
    createdBy: { displayName: 'Jake Miller', uniqueName: 'jake.miller@acmecorp.dev' },
    createdOn: '2026-03-19T14:00:00Z',
    environments: [
      {
        name: 'Dev',
        rank: 1,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-19T14:08:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Staging',
        rank: 2,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-19T15:00:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Production',
        rank: 3,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-19T17:00:00Z' }],
        preDeployApprovals: [
          {
            id: 3000,
            status: 'approved',
            approvalType: 'preDeploy',
            approver: { displayName: 'Maria Santos', uniqueName: 'maria.santos@acmecorp.dev' },
            createdOn: '2026-03-19T16:30:00Z',
            modifiedOn: '2026-03-19T16:40:00Z',
          },
        ],
        postDeployApprovals: [],
      },
    ],
    webUrl: `${BASE_URL}/_releaseProgress?_a=release-pipeline-progress&releaseId=705`,
  },
  {
    id: 704,
    name: 'Release-704',
    releaseDefinition: { id: 50, name: 'Acme Web Production' },
    createdBy: { displayName: 'Alex Chen', uniqueName: 'alex.chen@acmecorp.dev' },
    createdOn: '2026-03-18T11:00:00Z',
    environments: [
      {
        name: 'Staging',
        rank: 1,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-18T11:10:00Z' }],
        preDeployApprovals: [],
        postDeployApprovals: [],
      },
      {
        name: 'Production',
        rank: 2,
        status: 'succeeded',
        deploySteps: [{ lastModifiedOn: '2026-03-18T13:00:00Z' }],
        preDeployApprovals: [
          {
            id: 2998,
            status: 'approved',
            approvalType: 'preDeploy',
            approver: { displayName: 'Yuri Baumgartner', uniqueName: 'yuri@acmecorp.dev' },
            createdOn: '2026-03-18T12:30:00Z',
            modifiedOn: '2026-03-18T12:40:00Z',
          },
        ],
        postDeployApprovals: [],
      },
    ],
    webUrl: `${BASE_URL}/_releaseProgress?_a=release-pipeline-progress&releaseId=704`,
  },
];
