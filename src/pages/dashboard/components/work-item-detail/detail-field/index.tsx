import { cn } from '@/lib/utils';
import type { DetailFieldProps } from './types';

export function DetailField(props: DetailFieldProps) {
  const { icon: Icon, label, value, valueClassName } = props;

  return (
    <div className="flex flex-col gap-0.5 rounded-md px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
        <Icon size={11} />
        {label}
      </div>
      <span className={cn('text-[13px] text-fg-secondary', valueClassName)}>{value}</span>
    </div>
  );
}
