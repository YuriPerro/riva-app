import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamSwitcher } from '@/components/layout/team-switcher';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    if (spinning) return;
    setSpinning(true);
    queryClient.invalidateQueries();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <div className="flex items-center justify-between pb-2">
      <div className="flex items-center gap-2">
        <TeamSwitcher />

        <button
          onClick={handleRefresh}
          className={cn(
            'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors',
            'text-fg-muted hover:bg-elevated hover:text-fg',
          )}
        >
          <RefreshCw size={13} className={cn(spinning && 'animate-spin')} />
        </button>

        {actions}
      </div>

      <div className="flex flex-col items-end">
        <h2 className="text-4xl font-black text-fg/70">{title}</h2>
        {subtitle && <p className="text-[12px] text-fg-muted pr-1">{subtitle}</p>}
      </div>
    </div>
  );
}
