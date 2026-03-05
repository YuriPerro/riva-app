import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProjectSwitcher } from "@/components/layout/project-switcher";
import { useSessionStore } from "@/store/session";
import { useSettings } from "./use-settings";

export function SettingsPage() {
  const { isSigningOut, handleSignOut } = useSettings();
  const currentProject = useSessionStore((s) => s.project);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-fg">Settings</h1>
        <p className="text-sm text-fg-muted">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col gap-4">

        {/* Project */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">Project</span>
            <span className="text-sm text-fg-muted">
              {currentProject
                ? <>Currently working on <span className="text-fg">{currentProject}</span></>
                : "No project selected"}
            </span>
          </div>
          <ProjectSwitcher />
        </div>

        {/* Sign out */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">Sign out</span>
            <span className="text-sm text-fg-muted">
              Clear your credentials and return to the login screen
            </span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isSigningOut}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out of Forge?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your stored credentials will be removed. You'll need to enter your
                  organization URL and personal access token again to sign back in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignOut}
                  className="bg-error text-fg hover:bg-error/90"
                  disabled={isSigningOut}
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </div>
    </div>
  );
}
