export function formatAgo(dateStr?: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string): string {
  return name
    .split(/[\s_-]/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getAssigneeInitials(
  assignedTo?: { displayName: string } | null,
): string {
  if (!assignedTo || typeof assignedTo !== "object") return "?";
  const name = assignedTo.displayName ?? "";
  return initials(name) || "?";
}

export function extractDisplayName(
  identity?: { displayName: string } | null,
  fallback = "Unassigned",
): string {
  if (!identity || typeof identity !== "object") return fallback;
  return identity.displayName ?? fallback;
}

export function sanitizeHtml(html?: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed").forEach((el) => el.remove());
  return doc.body.innerHTML.trim();
}

export function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags.split(";").map((t) => t.trim()).filter(Boolean);
}

export function stripRefs(ref: string): string {
  return ref.replace("refs/heads/", "");
}
