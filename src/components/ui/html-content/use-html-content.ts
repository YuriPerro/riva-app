import { useState, useEffect, useCallback } from 'react';
import { azure } from '@/lib/tauri';

function extractImageUrls(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');
  const urls: string[] = [];
  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('http')) {
      urls.push(src);
    }
  });
  return urls;
}

function replaceImageUrls(html: string, urlMap: Map<string, string>): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && urlMap.has(src)) {
      img.setAttribute('src', urlMap.get(src)!);
    }
  });
  return doc.body.innerHTML;
}

export function useHtmlContent(html: string, onImageClick?: (src: string) => void) {
  const [resolvedHtml, setResolvedHtml] = useState(html);

  useEffect(() => {
    const urls = extractImageUrls(html);
    if (urls.length === 0) {
      setResolvedHtml(html);
      return;
    }

    let cancelled = false;

    async function resolveImages() {
      const urlMap = new Map<string, string>();
      const results = await Promise.allSettled(
        urls.map(async (url) => {
          const dataUri = await azure.proxyImage(url);
          return { url, dataUri };
        }),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          urlMap.set(result.value.url, result.value.dataUri);
        }
      }

      if (!cancelled && urlMap.size > 0) {
        setResolvedHtml(replaceImageUrls(html, urlMap));
      }
    }

    resolveImages();
    return () => { cancelled = true; };
  }, [html]);

  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      const src = (target as HTMLImageElement).src;
      if (src) onImageClick?.(src);
    }
  }, [onImageClick]);

  return { resolvedHtml, handleContentClick };
}
