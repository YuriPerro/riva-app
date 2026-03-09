import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSidebarStore } from '@/store/sidebar';
import { useLocaleStore } from '@/store/locale';
import { Route } from '@/types/routes';

const NAV_SHORTCUTS: Record<string, Route> = {
  '1': Route.Dashboard,
  '2': Route.Tasks,
  '3': Route.Pipelines,
  '4': Route.PullRequests,
  '5': Route.Releases,
};

export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'pt-BR' : 'en');
  }, [language, setLanguage]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const route = NAV_SHORTCUTS[e.key];
      if (route) {
        e.preventDefault();
        navigate(route);
        return;
      }

      switch (e.key) {
        case 's':
          e.preventDefault();
          toggleSidebar();
          break;

        case ',':
          e.preventDefault();
          navigate(Route.Settings);
          break;

        case 'r':
          e.preventDefault();
          queryClient.invalidateQueries();
          break;

        case 'l':
          e.preventDefault();
          toggleLanguage();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, queryClient, toggleSidebar, toggleLanguage]);
}
