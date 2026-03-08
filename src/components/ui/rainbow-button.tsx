import React from 'react';
import { cn } from '@/lib/utils';

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="group relative inline-flex overflow-hidden rounded-lg border border-border-subtle bg-transparent">
        <div
          className="pointer-events-none absolute -inset-x-1 bottom-0 z-0 h-[70%] animate-rainbow bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] opacity-70 blur-[6px]"
          style={{
            maskImage: 'linear-gradient(to top, black 0%, black 42%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 42%, transparent 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[60%] animate-rainbow bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%]"
          style={{
            maskImage: 'linear-gradient(to top, black 0%, black 58%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 58%, transparent 100%)',
          }}
        />
        <div className="pointer-events-none absolute inset-x-[2px] bottom-[2px] top-px z-20 rounded-md bg-base transition-colors group-hover:bg-elevated" />
        <button
          ref={ref}
          className={cn(
            'relative z-30 inline-flex cursor-pointer items-center justify-center gap-2 bg-transparent px-3 py-1.5 text-xs font-medium text-fg transition-colors disabled:pointer-events-none disabled:opacity-50',
            '[&_svg]:pointer-events-none [&_svg]:shrink-0',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

RainbowButton.displayName = 'RainbowButton';

export { RainbowButton, type RainbowButtonProps };
