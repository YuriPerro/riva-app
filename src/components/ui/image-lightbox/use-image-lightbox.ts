import { useRef, useCallback } from 'react';
import { azure } from '@/lib/tauri';
import type { ZoomRef } from 'yet-another-react-lightbox';

export function useImageLightbox(src: string | null) {
  const zoomRef = useRef<ZoomRef>(null);

  const handleDownload = useCallback(() => {
    if (!src) return;
    azure.saveImage(src);
  }, [src]);

  const handleZoomIn = useCallback(() => {
    zoomRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    zoomRef.current?.zoomOut();
  }, []);

  const handleResetZoom = useCallback(() => {
    zoomRef.current?.changeZoom(1);
  }, []);

  return {
    zoomRef,
    handleDownload,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  };
}
