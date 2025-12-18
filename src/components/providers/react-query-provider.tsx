'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configurações para tempo real e offline-first
            staleTime: 1000 * 60, // 1 minute - dados considerados frescos por 1 minuto
            gcTime: 1000 * 60 * 5, // 5 minutes - cache mantido por 5 minutos
            retry: 3,
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
            // Polling inteligente para tempo real (desabilitado por padrão, ativado por query)
            refetchInterval: false,
          },
          mutations: {
            retry: 1,
            // Otimistic updates habilitados por padrão
            onError: (error: unknown) => {
              console.error('Mutation error:', error);
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
