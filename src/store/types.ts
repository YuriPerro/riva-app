export interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

export interface SessionState {
  project: string | null;
  team: string | null;
  setProject: (project: string) => void;
  setTeam: (team: string) => void;
  clear: () => void;
}
