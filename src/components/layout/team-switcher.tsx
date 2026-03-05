import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Check, Loader2 } from "lucide-react";
import { azure, type Team } from "@/lib/tauri";
import { cn } from "@/lib/utils";

function teamInitials(name: string) {
  return name
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Fuzzy search ────────────────────────────────────────────────────────────
//
// Handles common typing patterns for team names:
//   "squad ia"  → exact substring match
//   "si"        → acronym match (first letter of each word)
//   "Squad ai"  → word-level match where "ai" ≈ "ia" (same chars, different order)
//   "sq ia"     → partial word + exact word

/** True when a and b contain exactly the same characters (order-insensitive). */
function sameCharSet(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return a.split("").sort().join("") === b.split("").sort().join("");
}

function teamMatchesSearch(query: string, teamName: string): boolean {
  const q = query.toLowerCase().trim();
  const t = teamName.toLowerCase().trim();

  if (!q) return true;

  // 1. Direct substring — "squad ia" in "squad ia"
  if (t.includes(q)) return true;

  // 2. Acronym — "si" matches "SQUAD IA" (s·i)
  const acronym = t.split(/[\s_-]+/).map((w) => w[0] ?? "").join("");
  if (acronym.startsWith(q) || acronym.includes(q)) return true;

  // 3. Word-level AND — every query word must loosely match some target word
  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/[\s_-]+/).filter(Boolean);

  return qWords.every((qw) =>
    tWords.some(
      (tw) =>
        tw.includes(qw) ||      // "squad" in "squad"
        qw.includes(tw) ||      // target word inside query word
        sameCharSet(qw, tw)     // "ai" ↔ "ia"  (same letters, different order)
    )
  );
}

export function TeamSwitcher() {
  const project = localStorage.getItem("forge_project") ?? "";

  const [currentTeam, setCurrentTeam] = useState(
    localStorage.getItem("forge_team") ?? ""
  );
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Lazy-load teams when dropdown opens (cache in state so we don't re-fetch)
  useEffect(() => {
    if (!open || teams.length > 0 || !project) return;
    setLoading(true);
    azure
      .getTeams(project)
      .then(setTeams)
      .finally(() => setLoading(false));
  }, [open, project, teams.length]);

  // Focus search input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Sync when external code changes the team (e.g. team-select page)
  useEffect(() => {
    const handler = (e: Event) => {
      const { team } = (e as CustomEvent<{ team: string }>).detail;
      setCurrentTeam(team);
    };
    window.addEventListener("forge:team-changed", handler);
    return () => window.removeEventListener("forge:team-changed", handler);
  }, []);

  const selectTeam = (name: string) => {
    localStorage.setItem("forge_team", name);
    setCurrentTeam(name);
    window.dispatchEvent(
      new CustomEvent("forge:team-changed", { detail: { team: name } })
    );
    setOpen(false);
  };

  const filtered = search
    ? teams.filter((t) => teamMatchesSearch(search, t.name))
    : teams;

  if (!project) return null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition-colors",
          open
            ? "border-border bg-elevated text-fg"
            : "border-border bg-elevated text-fg-secondary hover:text-fg"
        )}
      >
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold",
            "bg-accent/20 text-accent"
          )}
        >
          {currentTeam ? teamInitials(currentTeam) : "?"}
        </span>
        <span className="max-w-[112px] truncate">
          {currentTeam || "Select team"}
        </span>
        <ChevronDown
          size={11}
          className={cn(
            "shrink-0 text-fg-disabled transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5 w-56",
            "rounded-lg border border-border bg-surface shadow-lg"
          )}
        >
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={12} className="shrink-0 text-fg-disabled" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              className="w-full bg-transparent text-[12px] text-fg placeholder:text-fg-disabled outline-none"
            />
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={13} className="animate-spin text-fg-disabled" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-fg-disabled">
                No teams found
              </p>
            ) : (
              filtered.map((team) => {
                const active = team.name === currentTeam;
                return (
                  <button
                    key={team.id}
                    onClick={() => selectTeam(team.name)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors",
                      active
                        ? "text-fg"
                        : "text-fg-secondary hover:bg-elevated hover:text-fg"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold",
                        active
                          ? "bg-accent/20 text-accent"
                          : "bg-base text-fg-muted"
                      )}
                    >
                      {teamInitials(team.name)}
                    </span>
                    <span className="flex-1 truncate">{team.name}</span>
                    {active && (
                      <Check size={11} className="shrink-0 text-accent" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
