import { Loader2, AlertCircle, FolderKanban } from "lucide-react";
import { useProjectSelect } from "./use-project-select";

function ProjectInitial({ name }: { name: string }) {
  const initials = name
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-[13px] font-semibold text-accent">
      {initials}
    </div>
  );
}

export function ProjectSelectPage() {
  const { projects, isLoading, error, selectProject } = useProjectSelect();

  return (
    <div data-tauri-drag-region className="flex h-full min-h-screen flex-col items-center justify-center bg-base px-6">

      <div className="w-full max-w-[560px]">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface">
            <FolderKanban size={18} className="text-fg" />
          </div>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-fg">Select a project</h1>
            <p className="mt-1 text-[13px] text-fg-muted">
              Choose the project you want to work on
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 size={16} className="animate-spin text-fg-disabled" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-2 gap-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => selectProject(project.name)}
                className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-elevated"
              >
                <ProjectInitial name={project.name} />
                <div>
                  <p className="text-[13px] font-medium text-fg">{project.name}</p>
                  {project.description && (
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-fg-muted">
                      {project.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
