import { useEffect, useRef, useCallback } from 'react';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { useSessionStore } from '@/store/session';
import { useNotificationSettingsStore } from '@/store/notifications';
import { azure } from '@/lib/tauri/azure';
import { session } from '@/lib/tauri/session';
import type { PullRequest, PipelineRun } from '@/types/azure';
import type { PrReviewSnapshot } from '@/types/notifications';

function buildPrSnapshot(prs: PullRequest[], uniqueName: string): PrReviewSnapshot {
  const snapshot: PrReviewSnapshot = {};
  for (const pr of prs) {
    const isMyPr = pr.createdBy.uniqueName.toLowerCase() === uniqueName.toLowerCase();
    if (!isMyPr) continue;
    snapshot[pr.pullRequestId] = {};
    for (const reviewer of pr.reviewers) {
      snapshot[pr.pullRequestId][reviewer.displayName] = reviewer.vote;
    }
  }
  return snapshot;
}

function buildFailedPipelineIds(pipelines: PipelineRun[]): Set<number> {
  const ids = new Set<number>();
  for (const p of pipelines) {
    if (p.result === 'failed') ids.add(p.id);
  }
  return ids;
}

function voteLabel(vote: number): string {
  if (vote === 10) return 'approved';
  if (vote === -10) return 'rejected';
  return 'reviewed';
}

export function useAzureNotificationPolling() {
  const project = useSessionStore((s) => s.project);
  const uniqueName = useSessionStore((s) => s.uniqueName);

  const pollingInterval = useNotificationSettingsStore((s) => s.pollingInterval);
  const prReviewEnabled = useNotificationSettingsStore((s) => s.prReviewEnabled);
  const pipelineFailedEnabled = useNotificationSettingsStore((s) => s.pipelineFailedEnabled);
  const workItemMentionEnabled = useNotificationSettingsStore((s) => s.workItemMentionEnabled);

  const prSnapshotRef = useRef<PrReviewSnapshot | null>(null);
  const pipelineSnapshotRef = useRef<Set<number> | null>(null);
  const lastPollTimestampRef = useRef<string | null>(null);
  const notifiedCommentIdsRef = useRef<Set<number>>(new Set());
  const permissionCheckedRef = useRef(false);

  const ensurePermission = useCallback(async () => {
    if (permissionCheckedRef.current) return;
    permissionCheckedRef.current = true;
    const granted = await isPermissionGranted();

    if (!granted) await requestPermission();
  }, []);

  const poll = useCallback(async () => {
    const hasActiveSession = await session.exists();
    if (!hasActiveSession || !project || !uniqueName) return;

    await ensurePermission();

    const anyEnabled = prReviewEnabled || pipelineFailedEnabled || workItemMentionEnabled;
    if (!anyEnabled) return;

    if (prReviewEnabled) {
      try {
        const prs = await azure.getPullRequests(project);
        const currentSnapshot = buildPrSnapshot(prs, uniqueName);

        if (prSnapshotRef.current) {
          const prevSnapshot = prSnapshotRef.current;
          for (const prIdStr of Object.keys(currentSnapshot)) {
            const prId = Number(prIdStr);
            const currentVotes = currentSnapshot[prId];
            const prevVotes = prevSnapshot[prId] ?? {};

            for (const [displayName, vote] of Object.entries(currentVotes)) {
              const prevVote = prevVotes[displayName];
              const isNewReview = prevVote !== vote && (vote === 10 || vote === -10);
              if (isNewReview) {
                const pr = prs.find((p) => p.pullRequestId === prId);
                await sendNotification({
                  title: `PR ${voteLabel(vote)}`,
                  body: `${displayName} ${voteLabel(vote)} "${pr?.title ?? `PR #${prId}`}"`,
                });
              }
            }
          }
        }

        prSnapshotRef.current = currentSnapshot;
      } catch (error) {
        console.error(error);
      }
    }

    if (pipelineFailedEnabled) {
      try {
        const pipelines = await azure.getRecentPipelines(project);
        const currentFailedIds = buildFailedPipelineIds(pipelines);

        if (pipelineSnapshotRef.current) {
          for (const id of currentFailedIds) {
            const isNewFailure = !pipelineSnapshotRef.current.has(id);
            if (isNewFailure) {
              const pipeline = pipelines.find((p) => p.id === id);
              await sendNotification({
                title: 'Pipeline failed',
                body: `${pipeline?.definition.name ?? 'Pipeline'} #${pipeline?.buildNumber ?? id} failed`,
              });
            }
          }
        }

        pipelineSnapshotRef.current = currentFailedIds;
      } catch (error) {
        console.error(error);
      }
    }

    if (workItemMentionEnabled) {
      try {
        const sinceTimestamp = lastPollTimestampRef.current ?? new Date().toISOString();
        lastPollTimestampRef.current = new Date().toISOString();

        const comments = await azure.getWorkItemRecentComments(project, sinceTimestamp);

        for (const comment of comments) {
          const mentionsUser = comment.text.toLowerCase().includes(`@${uniqueName.toLowerCase()}`);
          const alreadyNotified = notifiedCommentIdsRef.current.has(comment.commentId);

          if (mentionsUser && !alreadyNotified) {
            notifiedCommentIdsRef.current.add(comment.commentId);
            await sendNotification({
              title: 'Mentioned in work item',
              body: `${comment.createdBy} mentioned you in "${comment.workItemTitle}"`,
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [project, uniqueName, prReviewEnabled, pipelineFailedEnabled, workItemMentionEnabled, ensurePermission]);

  useEffect(() => {
    if (pollingInterval === 'off' || !project || !uniqueName) return;

    const intervalMs = pollingInterval * 60 * 1000;

    poll();

    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [pollingInterval, project, uniqueName, poll]);
}
