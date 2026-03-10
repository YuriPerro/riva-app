import { useMemo } from 'react';
import {
  ExternalLink,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Flag,
  GitBranch,
  Clock,
  Hourglass,
  CheckCircle2,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ShineBorder } from '@/components/ui/shine-border';
import { getRawTypeI18nKey } from '@/utils/mappers';
import { useWorkItemDetail } from './use-work-item-detail';
import { StatusField } from '../work-item-status-field';
import { BranchField } from '../work-item-branch-field';
import { DetailField } from '../work-item-detail-field';
import { RelatedItems } from '../work-item-related-items';
import { EditableTitle } from '../work-item-editable-title';
import type { WorkItemDetailDialogProps, PriorityLabel, DisplayDetail } from './types';

type DevFieldKey = 'effort' | 'completedWork' | 'remainingWork' | 'dueDate' | 'devStartDate' | 'devEndDate' | 'blocked';

const DEV_FIELDS_BY_TYPE: Record<string, DevFieldKey[]> = {
  Task: ['effort', 'completedWork', 'remainingWork', 'dueDate', 'blocked'],
  Bug: ['effort', 'completedWork', 'remainingWork', 'devStartDate', 'devEndDate', 'blocked'],
  'Product Backlog Item': ['effort', 'devStartDate', 'devEndDate', 'blocked'],
  Feature: ['effort', 'devStartDate', 'devEndDate', 'blocked'],
  Epic: ['effort', 'devStartDate', 'devEndDate', 'blocked'],
};

const DEFAULT_DEV_FIELDS: DevFieldKey[] = ['effort', 'blocked'];

const priorityConfig: Record<PriorityLabel, string> = {
  Critical: 'text-error',
  High: 'text-warning',
  Medium: 'text-info',
  Low: 'text-fg-muted',
  None: 'text-fg-disabled',
};

export function WorkItemDetailDialog(props: WorkItemDetailDialogProps) {
  const { itemId, project, onClose, onNavigate } = props;
  const { detail, theme, states, isLoading, isUpdating, updateState, updateTitle, isTitleUpdating, error } = useWorkItemDetail(project, itemId);
  const { t } = useTranslation(['dashboard', 'common']);

  const DEV_FIELD_META: Record<DevFieldKey, { icon: React.ElementType; label: string }> = useMemo(() => ({
    effort: { icon: Zap, label: t('dashboard:workItemDetail.effort') },
    completedWork: { icon: CheckCircle2, label: t('dashboard:workItemDetail.completedWork') },
    remainingWork: { icon: Hourglass, label: t('dashboard:workItemDetail.remainingWork') },
    dueDate: { icon: Calendar, label: t('dashboard:workItemDetail.dueDate') },
    devStartDate: { icon: Calendar, label: t('dashboard:workItemDetail.devStartDate') },
    devEndDate: { icon: Calendar, label: t('dashboard:workItemDetail.devEndDate') },
    blocked: { icon: ShieldAlert, label: t('dashboard:workItemDetail.blocked') },
  }), [t]);

  const isOpen = itemId !== null;
  const TypeIcon = theme.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
        <ShineBorder shineColor={theme.shineColors} borderWidth={1} duration={10} />
        {detail && (
          <button
            onClick={() => openUrl(detail.webUrl)}
            className="absolute right-14 top-4 flex cursor-pointer items-center gap-1 rounded-sm text-[11px] text-fg-muted opacity-70 transition-opacity hover:opacity-100"
          >
            {t('common:actions.viewInDevOps')}
            <ExternalLink size={11} />
          </button>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={16} className="animate-spin text-fg-disabled" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {detail && (
          <>
            <DialogHeader className="mt-3">
              <span className="text-[14px] text-fg-disabled">#{itemId}</span>
              <DialogTitle className="sr-only">{detail.title}</DialogTitle>
              <EditableTitle title={detail.title} onSave={updateTitle} isUpdating={isTitleUpdating} />
              <DialogDescription className="sr-only">{t('dashboard:workItemDetail.detailsFor', { title: detail.title })}</DialogDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <TypeIcon size={12} className={theme.className} />
                  <span className={cn('text-[11px] font-medium', theme.className)}>{t(`common:${getRawTypeI18nKey(detail.type)}`)}</span>
                </div>
                {detail.tags.length > 0 && (
                  <>
                    <span className="text-fg-disabled">·</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {detail.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-fg-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <StatusField
                  currentState={detail.state}
                  states={states}
                  isUpdating={isUpdating}
                  onSelect={updateState}
                />
                <DetailField icon={User} label={t('dashboard:workItemDetail.assignedTo')} value={detail.assignee} />
                <DetailField icon={GitBranch} label={t('dashboard:workItemDetail.iteration')} value={detail.iterationPath} />
                <DetailField
                  icon={Flag}
                  label={t('dashboard:workItemDetail.priority')}
                  value={detail.priority}
                  valueClassName={priorityConfig[detail.priority]}
                />
                <DetailField icon={User} label={t('dashboard:workItemDetail.createdBy')} value={detail.createdBy} />
                <DetailField icon={Calendar} label={t('dashboard:workItemDetail.created')} value={detail.createdDate} />
                <DetailField icon={Calendar} label={t('dashboard:workItemDetail.lastUpdated')} value={detail.changedDate} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <Clock size={11} />
                  {t('dashboard:workItemDetail.dev')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(DEV_FIELDS_BY_TYPE[detail.type] ?? DEFAULT_DEV_FIELDS).map((key) => {
                    const meta = DEV_FIELD_META[key];
                    const raw = detail[key as keyof DisplayDetail] as string | null;
                    const value = raw ?? '—';
                    return (
                      <DetailField
                        key={key}
                        icon={meta.icon}
                        label={meta.label}
                        value={value}
                        valueClassName={key === 'blocked' && value === 'Yes' ? 'text-error' : undefined}
                      />
                    );
                  })}
                </div>
              </div>

              <BranchField id={itemId!} type={detail.type} />

              <RelatedItems
                parent={detail.parent}
                children={detail.children}
                onSelect={(id) => onNavigate?.(id)}
              />

              {detail.description && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-fg-muted">{t('dashboard:workItemDetail.description')}</span>
                  <div
                    className="text-[13px] text-fg-secondary leading-relaxed [&_a]:text-accent [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1"
                    dangerouslySetInnerHTML={{ __html: detail.description }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
