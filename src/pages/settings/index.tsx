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
import { ThemePicker } from './components/theme-picker';
import { AiSettings } from './components/ai-settings';
import { useSettings } from './use-settings';

export function SettingsPage() {
  const { isSigningOut, handleSignOut } = useSettings();
  const currentProject = useSessionStore((s) => s.project);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">Project</span>
            <span className="text-sm text-fg-muted">
              {currentProject ? (
                <>
                  Currently working on <span className="text-fg">{currentProject}</span>
                </>
              ) : (
                'No project selected'
              )}
            </span>
          </div>
          <ProjectSwitcher />
        </div>

        <AiSettings />

        <ThemePicker />

        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">Sign out</span>
            <span className="text-sm text-fg-muted">Clear your credentials and return to the login screen</span>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isSigningOut}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign out of Forge?</DialogTitle>
                <DialogDescription>
                  Your stored credentials will be removed. You'll need to enter your organization URL and personal
                  access token again to sign back in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
