import { ExternalLink, Rocket, User, Calendar, Hash, Check, X } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FillButton } from '@/components/ui/fill-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { formatDate } from '@/utils/formatters';
import { EnvironmentRow } from '../environment-row';
import type { ReleaseDetailDialogProps } from './types';

export function ReleaseDetailDialog(props: ReleaseDetailDialogProps) {
  const { release, onClose, onApprove, onReject, isApproving, myPendingApproval } = props;
  const isOpen = release !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col border-transparent">
        <BorderBeam colorFrom="var(--color-accent)" colorTo="var(--color-accent-muted)" duration={10} size={120} />

        {release && (
          <>
            <button
              onClick={() => openUrl(release.url).catch(console.error)}
              className="absolute right-14 top-4 flex cursor-pointer items-center gap-1 rounded-sm text-[11px] text-fg-muted opacity-70 transition-opacity hover:opacity-100"
            >
              View in DevOps
              <ExternalLink size={11} />
            </button>

            <DialogHeader className="mt-3">
              <div className="flex items-center gap-2">
                <Rocket size={14} className="text-accent" />
                <DialogTitle className="text-[17px] leading-snug">{release.name}</DialogTitle>
              </div>
              <DialogDescription className="sr-only">Release details for {release.name}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-1 gap-5 overflow-y-auto py-1">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">Pipeline</span>
                <div className="mt-2">
                  {release.environments.map((env, idx) => (
                    <EnvironmentRow
                      key={env.name}
                      name={env.name}
                      status={env.status}
                      lastDeployedOn={env.lastDeployedOn}
                      isLast={idx === release.environments.length - 1}
                      approvals={env.approvals}
                      currentUserUniqueName={currentUserUniqueName}
                    />
                  ))}
                </div>
              </div>

              <div className="w-px bg-border" />

              <div className="flex-1 shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">Details</span>

                <div className="mt-2 space-y-2.5">
                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-fg-disabled">
                      <Rocket size={9} />
                      Definition
                    </span>
                    <span className="text-[12px] text-fg-secondary">{release.definitionName}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-fg-disabled">
                      <User size={9} />
                      Created by
                    </span>
                    <span className="text-[12px] text-fg-secondary">{release.createdBy}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-fg-disabled">
                      <Calendar size={9} />
                      Created
                    </span>
                    <span className="text-[12px] text-fg-secondary">{formatDate(release.createdOn)}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-fg-disabled">
                      <Hash size={9} />
                      Release ID
                    </span>
                    <span className="font-mono text-[12px] text-fg-secondary">{release.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {myPendingApproval && (
              <div className="flex items-center justify-end gap-2 border-border pt-3">
                <FillButton
                  onClick={() => onReject(myPendingApproval.id)}
                  disabled={isApproving}
                  fillColor="var(--color-error)"
                  className="border-border text-fg-muted hover:border-error"
                >
                  <X size={12} />
                  Reject
                </FillButton>
                <FillButton
                  onClick={() => onApprove(myPendingApproval.id)}
                  disabled={isApproving}
                  fillColor="var(--color-success)"
                  className="border-border text-fg-muted hover:border-success"
                >
                  <Check size={12} />
                  Approve
                </FillButton>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
