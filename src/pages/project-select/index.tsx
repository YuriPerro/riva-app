import { useState } from 'react';
import { Loader2, AlertCircle, FolderKanban, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fuzzyMatch } from '@/utils/search';
import { ProjectInitial } from './components/project-initial';
import { useProjectSelect } from './use-project-select';

export function ProjectSelectPage() {
  const { projects, isLoading, error, selectProject } = useProjectSelect();
  const [query, setQuery] = useState('');

  const filtered = query ? projects.filter((p) => fuzzyMatch(query, p.name)) : projects;

  return (
    <div data-tauri-drag-region className="flex min-h-screen flex-col items-center overflow-y-auto bg-base px-6 py-14">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface">
            <FolderKanban size={18} className="text-fg" />
          </div>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-fg">Select a project</h1>
            <p className="mt-1 text-[13px] text-fg-muted">Choose the project you want to work on</p>
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
          <>
            {projects.length > 5 && (
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-disabled" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects..."
                  autoFocus
                  className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-[13px] text-fg placeholder:text-fg-disabled focus:border-accent focus:outline-none"
                />
              </div>
            )}

            <div className="flex max-h-[340px] flex-col overflow-y-auto rounded-lg border border-border">
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-[12px] text-fg-disabled">
                  No projects matching "{query}"
                </div>
              )}
              {filtered.map((project, i) => (
                <button
                  key={project.id}
                  onClick={() => selectProject(project.name)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated',
                    i > 0 && 'border-t border-border-subtle',
                  )}
                >
                  <ProjectInitial name={project.name} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-medium text-fg-secondary">{project.name}</span>
                    {project.description && (
                      <span className="truncate text-[11px] text-fg-disabled">{project.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
