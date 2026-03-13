import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { useImageLightbox } from './use-image-lightbox';
import type { ImageLightboxProps } from './types';

const DOCK_BUTTON_CLASS = 'group flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white/70 transition-all duration-200 hover:scale-125 hover:bg-white/10 hover:text-white active:scale-95';

export function ImageLightbox(props: ImageLightboxProps) {
  const { src, onClose } = props;
  const { zoomRef, handleDownload, handleZoomIn, handleZoomOut, handleResetZoom } = useImageLightbox(src);

  return (
    <Lightbox
      open={!!src}
      close={onClose}
      slides={src ? [{ src }] : []}
      plugins={[Zoom]}
      zoom={{ ref: zoomRef, maxZoomPixelRatio: 5 }}
      carousel={{ finite: true }}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
        buttonZoom: () => null,
        iconClose: () => <X size={20} strokeWidth={1.5} />,
        controls: () => (
          <div className="fixed bottom-6 left-1/2 z-[1] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-black/60 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
            <button onClick={handleZoomIn} title="Zoom in" className={DOCK_BUTTON_CLASS}>
              <ZoomIn size={18} strokeWidth={1.5} />
            </button>
            <button onClick={handleZoomOut} title="Zoom out" className={DOCK_BUTTON_CLASS}>
              <ZoomOut size={18} strokeWidth={1.5} />
            </button>
            <div className="mx-1 h-5 w-px bg-white/15" />
            <button onClick={handleResetZoom} title="Reset zoom" className={DOCK_BUTTON_CLASS}>
              <RotateCw size={18} strokeWidth={1.5} />
            </button>
            <button onClick={handleDownload} title="Download" className={DOCK_BUTTON_CLASS}>
              <Download size={18} strokeWidth={1.5} />
            </button>
          </div>
        ),
      }}
      toolbar={{
        buttons: ['close'],
      }}
      on={{
        entering: () => {
          document.querySelector<HTMLElement>('.yarl__toolbar')?.style.setProperty('background', 'transparent');
        },
      }}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)' },
        toolbar: { background: 'transparent' },
      }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}
