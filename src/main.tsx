import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/animate-ui/components/animate/tooltip';
import { AppRoutes } from './routes';
import { themeManager } from '@/lib/theme-manager';
import i18n from '@/lib/i18n';
import './styles/globals.css';
import '@/lib/dayjs';

themeManager.init();

function handleGlobalError(err: unknown) {
  toast.error(typeof err === 'string' ? err : i18n.t('errors.somethingWentWrong'));
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: handleGlobalError,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider openDelay={300}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--color-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-fg)',
              fontSize: '13px',
              borderRadius: '8px',
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
