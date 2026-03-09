import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, GitPullRequest } from 'lucide-react';
import type { PR } from '../../use-pull-requests';
import { PRCard } from '../pr-card';
import type { PullRequestsContentProps } from './types';

function groupByRepo(prs: PR[]) {
  const groups = new Map<string, PR[]>();
  for (const pr of prs) {
    if (!groups.has(pr.repo)) groups.set(pr.repo, []);
    groups.get(pr.repo)!.push(pr);
  }
  return groups;
}

export function PullRequestsContent(props: PullRequestsContentProps) {
  const { error, filtered, openPR, reviewPR, isReviewing } = props;
  const { t } = useTranslation('pull-requests');
  const repoGroups = useMemo(() => groupByRepo(filtered), [filtered]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-error">
        <AlertCircle size={14} />
        {error}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <GitPullRequest size={24} className="text-fg-disabled" />
        <span className="text-[13px] text-fg-disabled">{t('noResults')}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-5 pb-2">
        {[...repoGroups.entries()].map(([repo, repoPRs]) => (
          <div key={repo}>
            {repoGroups.size > 1 && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">{repo}</span>
                <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">
                  {repoPRs.length}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {repoPRs.map((pr) => (
                <PRCard
                  key={pr.id}
                  pr={pr}
                  onOpen={() => openPR(pr.url)}
                  onApprove={() => reviewPR(pr.repoId, pr.id, 10)}
                  onReject={() => reviewPR(pr.repoId, pr.id, -10)}
                  isReviewing={isReviewing}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
