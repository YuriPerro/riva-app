import { cn } from '@/lib/utils';
import type { FillButtonProps } from './types';

export function FillButton(props: FillButtonProps) {
  const { fillColor, filledTextColor = 'white', className, style, children, ...rest } = props;

  return (
    <button
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-md border px-3 py-1.5 text-[11px] font-medium',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      style={{
        ...style,
        ['--fill-bg' as string]: fillColor,
        ['--fill-fg' as string]: filledTextColor,
      }}
      {...rest}
    >
      <span className="absolute inset-0 origin-left scale-x-0 bg-(--fill-bg) transition-transform duration-150 ease-out group-hover:scale-x-100" />
      <span className="relative z-10 flex items-center gap-1.5 transition-[color] duration-100 delay-0 group-hover:text-(--fill-fg) group-hover:delay-150">
        {children}
      </span>
    </button>
  );
}
