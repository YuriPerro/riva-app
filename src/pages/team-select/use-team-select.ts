import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { azure, type Team } from "@/lib/tauri";
import { useSessionStore } from "@/store/session";

export const useTeamSelect = () => {
  const navigate = useNavigate();
  const project = useSessionStore((s) => s.project);
  const setTeam = useSessionStore((s) => s.setTeam);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) {
      navigate("/project-select", { replace: true });
      return;
    }

    azure.getTeams(project)
      .then(setTeams)
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load teams"))
      .finally(() => setIsLoading(false));
  }, [project, navigate]);

  const selectTeam = (name: string, id: string) => {
    setTeam(name, id);
    navigate("/", { replace: true });
  };

  return { project: project ?? "", teams, isLoading, error, selectTeam };
};
