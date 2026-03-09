import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatAgo(dateStr?: string): string {
  if (!dateStr) return '—';
  return dayjs(dateStr).fromNow();
}

export function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return '—';
  const ms = dayjs(end).diff(dayjs(start));
  if (ms < 0) return '—';
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return dayjs(dateStr).format('MMM D, YYYY, hh:mm A');
}

export function initials(name: string): string {
  return name
    .split(/[\s_-]/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getAssigneeInitials(assignedTo?: { displayName: string } | null): string {
  if (!assignedTo || typeof assignedTo !== 'object') return '?';
  const name = assignedTo.displayName ?? '';
  return initials(name) || '?';
}

export function extractDisplayName(identity?: { displayName: string } | null, fallback = 'Unassigned'): string {
  if (!identity || typeof identity !== 'object') return fallback;
  return identity.displayName ?? fallback;
}

export function sanitizeHtml(html?: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed').forEach((el) => el.remove());
  return doc.body.innerHTML.trim();
}

export function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean);
}

const BUILD_REASON_LABELS: Record<string, string> = {
  individualCI: 'CI',
  batchedCI: 'CI',
  pullRequest: 'Pull Request',
  manual: 'Manual',
  schedule: 'Scheduled',
  buildCompletion: 'Chained',
  resourceTrigger: 'Resource',
  triggered: 'Triggered',
};

export function formatBuildReason(reason?: string): string {
  if (!reason) return 'CI';
  return BUILD_REASON_LABELS[reason] ?? reason;
}

export function stripRefs(ref: string): string {
  return ref.replace('refs/heads/', '');
}

export function buildBranchName(id: number, type: string): string {
  const prefix = type === 'bug' ? 'fix' : 'feat';
  return `${prefix}/${type}-${id}`;
}
