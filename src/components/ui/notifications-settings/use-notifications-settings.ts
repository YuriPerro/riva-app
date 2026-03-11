import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNotificationSettingsStore } from '@/store/notifications';
import { useSessionStore } from '@/store/session';
import { azure } from '@/lib/tauri/azure';
import type { PollingInterval } from '@/types/notifications';
import type { PollingIntervalOption } from './types';

export function useNotificationsSettings() {
  const { t } = useTranslation('common');
  const project = useSessionStore((s) => s.project);

  const pollingIntervalOptions: PollingIntervalOption[] = useMemo(() => [
    { value: 'off', label: t('polling.disabled') },
    { value: 1, label: t('polling.min', { count: 1 }) },
    { value: 2, label: t('polling.min', { count: 2 }) },
    { value: 5, label: t('polling.min', { count: 5 }) },
    { value: 10, label: t('polling.min', { count: 10 }) },
    { value: 30, label: t('polling.min', { count: 30 }) },
  ], [t]);

  const pollingInterval = useNotificationSettingsStore((s) => s.pollingInterval);
  const prReviewEnabled = useNotificationSettingsStore((s) => s.prReviewEnabled);
  const pipelineFailedEnabled = useNotificationSettingsStore((s) => s.pipelineFailedEnabled);
  const workItemMentionEnabled = useNotificationSettingsStore((s) => s.workItemMentionEnabled);
  const monitorAllPipelines = useNotificationSettingsStore((s) => s.monitorAllPipelines);
  const monitoredPipelineIds = useNotificationSettingsStore((s) => s.monitoredPipelineIds);
  const monitorAllReleases = useNotificationSettingsStore((s) => s.monitorAllReleases);
  const monitoredReleaseIds = useNotificationSettingsStore((s) => s.monitoredReleaseIds);
  const setPollingInterval = useNotificationSettingsStore((s) => s.setPollingInterval);
  const setPrReviewEnabled = useNotificationSettingsStore((s) => s.setPrReviewEnabled);
  const setPipelineFailedEnabled = useNotificationSettingsStore((s) => s.setPipelineFailedEnabled);
  const setWorkItemMentionEnabled = useNotificationSettingsStore((s) => s.setWorkItemMentionEnabled);
  const setMonitorAllPipelines = useNotificationSettingsStore((s) => s.setMonitorAllPipelines);
  const setMonitoredPipelineIds = useNotificationSettingsStore((s) => s.setMonitoredPipelineIds);
  const setMonitorAllReleases = useNotificationSettingsStore((s) => s.setMonitorAllReleases);
  const setMonitoredReleaseIds = useNotificationSettingsStore((s) => s.setMonitoredReleaseIds);

  const { data: pipelineDefinitions = [] } = useQuery({
    queryKey: ['pipeline-definitions', project],
    queryFn: () => azure.getPipelineDefinitions(project!),
    enabled: !!project && pipelineFailedEnabled,
    staleTime: 300_000,
  });

  const handleIntervalChange = (value: string) => {
    const parsed: PollingInterval = value === 'off' ? 'off' : (Number(value) as Exclude<PollingInterval, 'off'>);
    setPollingInterval(parsed);
  };

  const togglePipelineMonitored = useCallback((definitionId: number) => {
    if (monitorAllPipelines) {
      const allExceptThis = pipelineDefinitions
        .map((d) => d.id)
        .filter((id) => id !== definitionId);
      setMonitorAllPipelines(false);
      setMonitoredPipelineIds(allExceptThis);
      return;
    }

    const isCurrentlyMonitored = monitoredPipelineIds.includes(definitionId);
    if (isCurrentlyMonitored) {
      setMonitoredPipelineIds(monitoredPipelineIds.filter((id) => id !== definitionId));
    } else {
      const updated = [...monitoredPipelineIds, definitionId];
      const allSelected = pipelineDefinitions.every((d) => updated.includes(d.id));
      if (allSelected) {
        setMonitorAllPipelines(true);
        setMonitoredPipelineIds([]);
      } else {
        setMonitoredPipelineIds(updated);
      }
    }
  }, [monitorAllPipelines, monitoredPipelineIds, pipelineDefinitions, setMonitorAllPipelines, setMonitoredPipelineIds]);

  const toggleAllPipelines = useCallback(() => {
    if (monitorAllPipelines) {
      setMonitorAllPipelines(false);
      setMonitoredPipelineIds([]);
    } else {
      setMonitorAllPipelines(true);
      setMonitoredPipelineIds([]);
    }
  }, [monitorAllPipelines, setMonitorAllPipelines, setMonitoredPipelineIds]);

  const { data: releaseDefinitions = [] } = useQuery({
    queryKey: ['release-definitions', project],
    queryFn: () => azure.getReleaseDefinitions(project!),
    enabled: !!project && pipelineFailedEnabled,
    staleTime: 300_000,
  });

  const toggleReleaseMonitored = useCallback((definitionId: number) => {
    if (monitorAllReleases) {
      const allExceptThis = releaseDefinitions
        .map((d) => d.id)
        .filter((id) => id !== definitionId);
      setMonitorAllReleases(false);
      setMonitoredReleaseIds(allExceptThis);
      return;
    }

    const isCurrentlyMonitored = monitoredReleaseIds.includes(definitionId);
    if (isCurrentlyMonitored) {
      setMonitoredReleaseIds(monitoredReleaseIds.filter((id) => id !== definitionId));
    } else {
      const updated = [...monitoredReleaseIds, definitionId];
      const allSelected = releaseDefinitions.every((d) => updated.includes(d.id));
      if (allSelected) {
        setMonitorAllReleases(true);
        setMonitoredReleaseIds([]);
      } else {
        setMonitoredReleaseIds(updated);
      }
    }
  }, [monitorAllReleases, monitoredReleaseIds, releaseDefinitions, setMonitorAllReleases, setMonitoredReleaseIds]);

  const toggleAllReleases = useCallback(() => {
    if (monitorAllReleases) {
      setMonitorAllReleases(false);
      setMonitoredReleaseIds([]);
    } else {
      setMonitorAllReleases(true);
      setMonitoredReleaseIds([]);
    }
  }, [monitorAllReleases, setMonitorAllReleases, setMonitoredReleaseIds]);

  const isPollingActive = pollingInterval !== 'off';

  return {
    pollingInterval,
    prReviewEnabled,
    pipelineFailedEnabled,
    workItemMentionEnabled,
    isPollingActive,
    intervalOptions: pollingIntervalOptions,
    handleIntervalChange,
    setPrReviewEnabled,
    setPipelineFailedEnabled,
    setWorkItemMentionEnabled,
    pipelineDefinitions,
    monitoredPipelineIds,
    monitorAllPipelines,
    togglePipelineMonitored,
    toggleAllPipelines,
    releaseDefinitions,
    monitoredReleaseIds,
    monitorAllReleases,
    toggleReleaseMonitored,
    toggleAllReleases,
  };
}
