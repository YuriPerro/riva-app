import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Search, Check, Loader2 } from "lucide-react";
import { azure, type Project } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session";

function projectInitials(name: string) {
  return name
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sameCharSet(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return a.split("").sort().join("") === b.split("").sort().join("");
}

function projectMatchesSearch(query: string, projectName: string): boolean {
  const q = query.toLowerCase().trim();
  const p = projectName.toLowerCase().trim();

  if (!q) return true;
  if (p.includes(q)) return true;

  const acronym = p.split(/[\s_-]+/).map((w) => w[0] ?? "").join("");
  if (acronym.startsWith(q) || acronym.includes(q)) return true;

  const qWords = q.split(/\s+/).filter(Boolean);
  const pWords = p.split(/[\s_-]+/).filter(Boolean);

  return qWords.every((qw) =>
    pWords.some(
      (pw) =>
        pw.includes(qw) ||
        qw.includes(pw) ||
        sameCharSet(qw, pw)
    )
  );
}

export function ProjectSwitcher() {
  const currentProject = useSessionStore((s) => s.project);
  const setProject = useSessionStore((s) => s.setProject);
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch projects once when dropdown first opens
  useEffect(() => {
    if (!open || projects.length > 0) return;
    setLoading(true);
    azure
      .getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [open, projects.length]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const selectProject = (name: string) => {
    if (name === currentProject) {
      setOpen(false);
      return;
    }
    // setProject also clears team in the store
    setProject(name);
    queryClient.invalidateQueries();
    setOpen(false);
  };

  const filtered = useMemo(() =>
    search
      ? projects.filter((p) => projectMatchesSearch(search, p.name))
      : projects,
    [search, projects]
  );

  return (
    <div ref={containerRef} className="relative">
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
            "bg-fg-muted/15 text-fg-muted"
          )}
        >
          {currentProject ? projectInitials(currentProject) : "?"}
        </span>
        <span className="max-w-[100px] truncate">
          {currentProject || "Select project"}
        </span>
        <ChevronDown
          size={11}
          className={cn(
            "shrink-0 text-fg-disabled transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5 w-56",
            "rounded-lg border border-border bg-surface shadow-lg"
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={12} className="shrink-0 text-fg-disabled" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-transparent text-[12px] text-fg placeholder:text-fg-disabled outline-none"
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={13} className="animate-spin text-fg-disabled" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-fg-disabled">
                No projects found
              </p>
            ) : (
              filtered.map((project) => {
                const active = project.name === currentProject;
                return (
                  <button
                    key={project.id}
                    onClick={() => selectProject(project.name)}
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
                      {projectInitials(project.name)}
                    </span>
                    <span className="flex-1 truncate">{project.name}</span>
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
