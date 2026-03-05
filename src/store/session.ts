import { create } from "zustand";
import type { SessionState } from "./types";

export const useSessionStore = create<SessionState>((set) => ({
  project: localStorage.getItem("forge_project"),
  team: localStorage.getItem("forge_team"),

  setProject: (project) => {
    localStorage.setItem("forge_project", project);
    localStorage.removeItem("forge_team");
    set({ project, team: null });
  },

  setTeam: (team) => {
    localStorage.setItem("forge_team", team);
    set({ team });
  },

  clear: () => {
    localStorage.removeItem("forge_project");
    localStorage.removeItem("forge_team");
    set({ project: null, team: null });
  },
}));
