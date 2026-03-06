import { Loader2 } from 'lucide-react';

export function PageFallback() {
  return (
    <div data-tauri-drag-region className="flex h-full items-center justify-center">
      <Loader2 size={16} className="animate-spin text-fg-disabled" />
    </div>
  );
}
