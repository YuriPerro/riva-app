import { useMemo } from 'react';
import { ListTodo, GitPullRequest, Workflow, GitPullRequestArrow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Route } from '@/types/routes';
import type { StatsBarProps } from './types';

export function StatsBar(props: StatsBarProps) {
  const { stats } = props;
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const items = useMemo(() => [
    { value: stats.myTasks, label: t('stats.myTasks'), icon: ListTodo, path: Route.Tasks },
    { value: stats.inReview, label: t('stats.inReview'), icon: GitPullRequest, path: `${Route.Tasks}?status=in-review` },
    { value: stats.pipelinesRunning, label: t('stats.pipelinesRunning'), icon: Workflow, path: `${Route.Pipelines}?status=running` },
    { value: stats.openPRs, label: t('stats.openPRs'), icon: GitPullRequestArrow, path: `${Route.PullRequests}?status=active` },
  ], [stats, t]);

  return (
    <div className="flex gap-3 mt-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            onClick={() => navigate(item.path)}
            className="flex flex-1 items-center gap-3 rounded-md border border-border-subtle px-3 py-2.5 cursor-pointer transition-colors hover:bg-elevated hover:border-border opacity-0"
            style={{
              animation: `card-enter 400ms cubic-bezier(0.22, 1, 0.36, 1) ${100 + i * 75}ms forwards`,
            }}
          >
            <Icon size={15} className="text-fg shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[18px] font-semibold leading-none text-fg">{item.value}</span>
              <span className="text-[11px] text-fg-muted">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
