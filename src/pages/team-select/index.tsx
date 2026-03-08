import { useState } from 'react';
import { Loader2, AlertCircle, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fuzzyMatch } from '@/utils/search';
import { TeamInitial } from './components/team-initial';
import { useTeamSelect } from './use-team-select';

export function TeamSelectPage() {
  const { project, teams, isLoading, error, selectTeam } = useTeamSelect();
  const [query, setQuery] = useState('');

  const filtered = query ? teams.filter((t) => fuzzyMatch(query, t.name)) : teams;

  return (
    <div data-tauri-drag-region className="flex min-h-screen flex-col items-center overflow-y-auto bg-base px-6 py-14">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface">
            <Users size={18} className="text-fg" />
          </div>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-fg">Select a team</h1>
            <p className="mt-1 text-[13px] text-fg-muted">
              Choose your team in <span className="text-fg-secondary">{project}</span>
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
          <>
            {teams.length > 5 && (
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-disabled" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search teams..."
                  autoFocus
                  className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-[13px] text-fg placeholder:text-fg-disabled focus:border-accent focus:outline-none"
                />
              </div>
            )}

            <div className="flex max-h-[340px] flex-col overflow-y-auto rounded-lg border border-border">
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-[12px] text-fg-disabled">
                  No teams matching "{query}"
                </div>
              )}
              {filtered.map((team, i) => (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team.name, team.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated',
                    i > 0 && 'border-t border-border-subtle',
                  )}
                >
                  <TeamInitial name={team.name} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg-secondary group-hover:text-fg">
                    {team.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
