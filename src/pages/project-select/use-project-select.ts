import { useEffect, useState } from "react";
import { azure, type Project } from "@/lib/tauri";

export const useProjectSelect = () => {
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
    localStorage.setItem("forge_project", name);
    window.location.href = "/";
  };

  return { projects, isLoading, error, selectProject };
};
