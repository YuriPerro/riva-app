import { create } from 'zustand';
import type { SessionState } from './types';

export const useSessionStore = create<SessionState>((set) => ({
  project: localStorage.getItem('riva_project'),
  team: localStorage.getItem('riva_team'),
  teamId: localStorage.getItem('riva_team_id'),
  uniqueName: null,

  setProject: (project) => {
    localStorage.setItem('riva_project', project);
    localStorage.removeItem('riva_team');
    localStorage.removeItem('riva_team_id');
    set({ project, team: null, teamId: null });
  },

  setTeam: (team, teamId) => {
    localStorage.setItem('riva_team', team);
    localStorage.setItem('riva_team_id', teamId);
    set({ team, teamId });
  },

  setUniqueName: (uniqueName) => {
    set({ uniqueName });
  },

  clear: () => {
    localStorage.removeItem('riva_project');
    localStorage.removeItem('riva_team');
    localStorage.removeItem('riva_team_id');
    set({ project: null, team: null, teamId: null, uniqueName: null });
  },
}));
