import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { azure } from "@/lib/tauri";
import type { Project } from "@/types/azure";
import { Route } from "@/types/routes";
import { useSessionStore } from "@/store/session";

export const useProjectSelect = () => {
  const navigate = useNavigate();
  const setProject = useSessionStore((s) => s.setProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    azure.getProjects()
      .then(setProjects)
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load projects"))
      .finally(() => setIsLoading(false));
  }, []);

  const selectProject = (name: string) => {
    setProject(name);
    navigate(Route.TeamSelect, { replace: true });
  };

  return { projects, isLoading, error, selectProject };
};
