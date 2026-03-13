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
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { cn } from '@/lib/utils';
import { ShineBorder } from '@/components/ui/shine-border';
import { getRawTypeI18nKey } from '@/utils/mappers';
import { useWorkItemDetail } from './use-work-item-detail';
import { StatusField } from '../work-item-status-field';
import { BranchField } from '../work-item-branch-field';
import { DetailField } from '../work-item-detail-field';
import { RelatedItems } from '../work-item-related-items';
import { EditableTitle } from '../work-item-editable-title';
import { EditableNumberField } from '../work-item-editable-number-field';
import { EditableDateField } from '../work-item-editable-date-field';
import { EditableToggleField } from '../work-item-editable-toggle-field';
import { EditableSelectField } from '../work-item-editable-select-field';
import { HtmlContent } from '@/components/ui/html-content';
import type { WorkItemDetailDialogProps, PriorityLabel, DisplayDetail } from './types';

type DevFieldKey = 'effort' | 'estimateDays' | 'completedWork' | 'remainingWork' | 'dueDate' | 'devStartDate' | 'devEndDate' | 'blocked';

const DEV_FIELDS_BY_TYPE: Record<string, DevFieldKey[]> = {
  Task: ['effort', 'completedWork', 'remainingWork', 'dueDate', 'blocked'],
  Bug: ['effort', 'completedWork', 'remainingWork', 'devStartDate', 'devEndDate', 'blocked'],
  'Product Backlog Item': ['estimateDays', 'devStartDate', 'devEndDate', 'blocked'],
  Feature: ['effort', 'devStartDate', 'devEndDate', 'blocked'],
  Epic: ['effort', 'devStartDate', 'devEndDate', 'blocked'],
};

const DEFAULT_DEV_FIELDS: DevFieldKey[] = ['effort', 'blocked'];

const DEV_FIELD_PATH: Record<DevFieldKey, string> = {
  effort: 'Microsoft.VSTS.Scheduling.Effort',
  estimateDays: 'Microsoft.VSTS.Scheduling.OriginalEstimate',
  completedWork: 'Microsoft.VSTS.Scheduling.CompletedWork',
  remainingWork: 'Microsoft.VSTS.Scheduling.RemainingWork',
  dueDate: 'Microsoft.VSTS.Scheduling.DueDate',
  devStartDate: 'Microsoft.VSTS.Scheduling.StartDate',
  devEndDate: 'Microsoft.VSTS.Scheduling.FinishDate',
  blocked: 'Microsoft.VSTS.CMMI.Blocked',
};

const DEV_FIELD_TYPE: Record<DevFieldKey, 'number' | 'date' | 'toggle'> = {
  effort: 'number',
  estimateDays: 'number',
  completedWork: 'number',
  remainingWork: 'number',
  dueDate: 'date',
  devStartDate: 'date',
  devEndDate: 'date',
  blocked: 'toggle',
};

const priorityConfig: Record<PriorityLabel, string> = {
  Critical: 'text-error',
  High: 'text-warning',
  Medium: 'text-info',
  Low: 'text-fg-muted',
  None: 'text-fg-disabled',
};

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Critical', className: 'text-error' },
  { value: 2, label: 'High', className: 'text-warning' },
  { value: 3, label: 'Medium', className: 'text-info' },
  { value: 4, label: 'Low', className: 'text-fg-muted' },
];

export function WorkItemDetailDialog(props: WorkItemDetailDialogProps) {
  const { itemId, project, onClose, onNavigate } = props;
  const {
    detail, theme, states, isLoading, isUpdating, updateState, updateTitle, isTitleUpdating,
    updateField, isFieldUpdating, updatingFieldPath, error,
    lightboxSrc, isDialogOpen, handleImageClick, handleLightboxClose,
  } = useWorkItemDetail(project, itemId);
  const { t } = useTranslation(['dashboard', 'common']);

  const DEV_FIELD_META: Record<DevFieldKey, { icon: React.ElementType; label: string }> = useMemo(() => ({
    effort: { icon: Zap, label: t('dashboard:workItemDetail.effort') },
    estimateDays: { icon: Zap, label: t('dashboard:workItemDetail.estimateDays') },
    completedWork: { icon: CheckCircle2, label: t('dashboard:workItemDetail.completedWork') },
    remainingWork: { icon: Hourglass, label: t('dashboard:workItemDetail.remainingWork') },
    dueDate: { icon: Calendar, label: t('dashboard:workItemDetail.dueDate') },
    devStartDate: { icon: Calendar, label: t('dashboard:workItemDetail.devStartDate') },
    devEndDate: { icon: Calendar, label: t('dashboard:workItemDetail.devEndDate') },
    blocked: { icon: ShieldAlert, label: t('dashboard:workItemDetail.blocked') },
  }), [t]);

  const TypeIcon = theme.icon;

  return (
    <>
    <ImageLightbox src={lightboxSrc} onClose={handleLightboxClose} />
    <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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
                <EditableSelectField
                  icon={Flag}
                  label={t('dashboard:workItemDetail.priority')}
                  value={detail.priority}
                  fieldPath="Microsoft.VSTS.Common.Priority"
                  options={PRIORITY_OPTIONS}
                  onSave={updateField}
                  isUpdating={isFieldUpdating && updatingFieldPath === 'Microsoft.VSTS.Common.Priority'}
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
                    const fieldPath = DEV_FIELD_PATH[key];
                    const fieldType = DEV_FIELD_TYPE[key];
                    const isCurrentFieldUpdating = isFieldUpdating && updatingFieldPath === fieldPath;

                    if (fieldType === 'number') {
                      return (
                        <EditableNumberField
                          key={key}
                          icon={meta.icon}
                          label={meta.label}
                          value={raw}
                          fieldPath={fieldPath}
                          onSave={updateField}
                          isUpdating={isCurrentFieldUpdating}
                        />
                      );
                    }

                    if (fieldType === 'date') {
                      return (
                        <EditableDateField
                          key={key}
                          icon={meta.icon}
                          label={meta.label}
                          value={raw}
                          fieldPath={fieldPath}
                          onSave={updateField}
                          isUpdating={isCurrentFieldUpdating}
                        />
                      );
                    }

                    return (
                      <EditableToggleField
                        key={key}
                        icon={meta.icon}
                        label={meta.label}
                        value={raw ?? 'No'}
                        fieldPath={fieldPath}
                        onSave={updateField}
                        isUpdating={isCurrentFieldUpdating}
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
                  <HtmlContent
                    html={detail.description}
                    className="text-[13px] text-fg-secondary leading-relaxed"
                    onImageClick={handleImageClick}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
