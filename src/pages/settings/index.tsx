import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProjectSwitcher } from '@/components/layout/project-switcher';
import { useSessionStore } from '@/store/session';
import { ThemePicker } from '@/components/ui/theme-picker';
import { AiSettings } from './components/ai-settings';
import { NotificationsSettings } from '@/components/ui/notifications-settings';
import { LanguageSelector } from './components/language-selector';
import { useSettings } from './use-settings';

export function SettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const { isSigningOut, version, handleSignOut } = useSettings();
  const currentProject = useSessionStore((s) => s.project);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('settings:title')} subtitle={version ? `${t('settings:subtitle')} · v${version}` : t('settings:subtitle')} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">{t('settings:project.title')}</span>
            <span className="text-sm text-fg-muted">
              {currentProject ? (
                <>
                  {t('settings:project.currentlyWorkingOn')} <span className="text-fg">{currentProject}</span>
                </>
              ) : (
                t('settings:project.noProjectSelected')
              )}
            </span>
          </div>
          <ProjectSwitcher />
        </div>

        <AiSettings />

        <div className="grid grid-cols-4 gap-4">
          <NotificationsSettings />
          <LanguageSelector />
        </div>

        <ThemePicker />

        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">{t('settings:signOut.title')}</span>
            <span className="text-sm text-fg-muted">{t('settings:signOut.description')}</span>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isSigningOut}>
                <LogOut className="size-4" />
                {t('common:actions.signOut')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('settings:signOut.confirmTitle')}</DialogTitle>
                <DialogDescription>{t('settings:signOut.confirmDescription')}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('common:actions.cancel')}</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? t('common:actions.signingOut') : t('common:actions.signOut')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
