import { cn } from '@/lib/utils';
import { useHtmlContent } from './use-html-content';
import type { HtmlContentProps } from './types';

export function HtmlContent(props: HtmlContentProps) {
  const { html, className, onImageClick } = props;
  const { resolvedHtml, handleContentClick } = useHtmlContent(html, onImageClick);

  return (
    <div
      onClick={handleContentClick}
      className={cn(
        '[&_a]:text-accent [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1 [&_img]:max-w-full [&_img]:rounded [&_img]:my-2 [&_img]:cursor-pointer [&_img]:transition-opacity [&_img]:hover:opacity-80',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: resolvedHtml }}
    />
  );
}
