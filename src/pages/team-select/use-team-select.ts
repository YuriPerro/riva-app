import { useEffect, useState } from "react";
import { azure, type Team } from "@/lib/tauri";

export const useTeamSelect = () => {
  const project = localStorage.getItem("forge_project") ?? "";
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) {
      window.location.href = "/project-select";
      return;
    }

    azure.getTeams(project)
      .then(setTeams)
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load teams"))
      .finally(() => setIsLoading(false));
  }, [project]);

  const selectTeam = (name: string) => {
    localStorage.setItem("forge_team", name);
    window.location.href = "/";
  };

  return { project, teams, isLoading, error, selectTeam };
};
