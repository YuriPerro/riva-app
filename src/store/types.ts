export interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

export interface SessionState {
  project: string | null;
  team: string | null;
  teamId: string | null;
  uniqueName: string | null;
  setProject: (project: string) => void;
  setTeam: (team: string, teamId: string) => void;
  setUniqueName: (uniqueName: string) => void;
  clear: () => void;
}
