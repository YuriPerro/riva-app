import { Circle, ClipboardList, GitPullRequest } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { StandupSection } from '../standup-section';
import { TransitionGroupView } from '../standup-transition-group';
import { TypeIcon } from '../standup-type-icon';
import type { StandupContentProps } from './types';

export function StandupContent(props: StandupContentProps) {
  const { isLoading, isEmpty, standup, pastLabel, yesterdayGroups, todayGroups, hasTodayContent } = props;

  if (isLoading) {
    return (
      <LoadingState
        icon={<ClipboardList size={28} />}
        title="Loading Standup"
        phrases={[
          'Summoning yesterday\'s work...',
          'Finding what you actually did...',
          'Generating believable updates...',
          'Checking if you pushed code...',
        ]}
        compact
      />
    );
  }

  if (isEmpty || !standup) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-[12px] text-fg-disabled">No activity found for this period</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <StandupSection label={pastLabel} color="text-info" empty={yesterdayGroups.length === 0}>
        {yesterdayGroups.map((group) => (
          <TransitionGroupView key={group.toState} group={group} />
        ))}
      </StandupSection>

      <StandupSection label="Today" color="text-success" empty={!hasTodayContent}>
        {todayGroups.map((group) => (
          <TransitionGroupView key={group.toState} group={group} />
        ))}

        {standup.today.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
              <Circle size={7} className="fill-current text-running animate-pulse" />
              <span className="font-medium">Working on</span>
              <span className="text-fg-disabled">({standup.today.length})</span>
            </div>
            <div className="flex flex-col gap-1 pl-4">
              {standup.today.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-[12px]">
                  <TypeIcon type={item.workItemType} />
                  <span className="shrink-0 font-mono text-[11px] text-fg-disabled">#{item.id}</span>
                  <span className="min-w-0 text-fg-secondary">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {standup.todayPrs.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
              <GitPullRequest size={10} className="text-info" />
              <span className="font-medium">Pull Requests</span>
              <span className="text-fg-disabled">({standup.todayPrs.length})</span>
            </div>
            <div className="flex flex-col gap-1 pl-4">
              {standup.todayPrs.map((pr) => (
                <div key={`pr-${pr.id}`} className="flex items-center gap-1.5 text-[12px]">
                  <span className="mt-[2px] flex h-3 w-3 shrink-0 items-center justify-center">
                    <GitPullRequest size={11} className="text-info" />
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-fg-disabled">#{pr.id}</span>
                  <span className="min-w-0 text-fg-secondary">{pr.title}</span>
                  <span className="shrink-0 text-fg-disabled">· {pr.repo}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </StandupSection>

      {standup.blockers.length > 0 && (
        <StandupSection label="Blockers" color="text-error">
          {standup.blockers.map((b) => (
            <div key={b.id} className="flex items-center gap-1.5 text-[12px]">
              <TypeIcon type={b.workItemType} />
              <span className="shrink-0 font-mono text-[11px] text-fg-disabled">#{b.id}</span>
              <span className="min-w-0 text-fg-secondary">{b.title}</span>
            </div>
          ))}
        </StandupSection>
      )}
    </div>
  );
}
