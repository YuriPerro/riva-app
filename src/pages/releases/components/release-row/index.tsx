import { EnvironmentDot } from '../environment-dot';
import type { ReleaseRowProps } from './types';

export function ReleaseRow(props: ReleaseRowProps) {
  const { release, environmentNames, onClick } = props;

  const envByName = new Map(release.environments.map((e) => [e.name, e]));

  return (
    <button
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-elevated"
    >
      <span className="w-32 shrink-0 font-mono text-[11px] text-fg-disabled">{release.name}</span>

      <span className="w-36 shrink-0 truncate text-[11px] text-fg-secondary">{release.createdBy}</span>

      <div className="flex flex-1 items-center gap-1">
        {environmentNames.map((envName, idx) => {
          const env = envByName.get(envName);
          const status = env?.status ?? 'notStarted';
          return (
            <div key={envName} className="flex items-center gap-1">
              {idx > 0 && <span className="text-[10px] text-fg-disabled">&rarr;</span>}
              <EnvironmentDot name={envName} status={status} />
            </div>
          );
        })}
      </div>

      <span className="w-16 shrink-0 text-right text-[11px] text-fg-disabled">{release.ago}</span>
    </button>
  );
}
