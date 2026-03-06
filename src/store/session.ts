import { create } from 'zustand';
import type { SessionState } from './types';

export const useSessionStore = create<SessionState>((set) => ({
  project: localStorage.getItem('forge_project'),
  team: localStorage.getItem('forge_team'),
  teamId: localStorage.getItem('forge_team_id'),

  setProject: (project) => {
    localStorage.setItem('forge_project', project);
    localStorage.removeItem('forge_team');
    localStorage.removeItem('forge_team_id');
    set({ project, team: null, teamId: null });
  },

  setTeam: (team, teamId) => {
    localStorage.setItem('forge_team', team);
    localStorage.setItem('forge_team_id', teamId);
    set({ team, teamId });
  },

  clear: () => {
    localStorage.removeItem('forge_project');
    localStorage.removeItem('forge_team');
    localStorage.removeItem('forge_team_id');
    set({ project: null, team: null, teamId: null });
  },
}));
