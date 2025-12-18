import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook para polling inteligente
 * Ativa refetch automático quando a aba está ativa
 */
export function useRealtimeQuery<TData>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number; // in milliseconds, default 5000 (5s)
  },
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval || 5000, // 5 seconds default
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook para mutações com optimistic updates e invalidação de cache
 */
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateKeys?: unknown[][];
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      options.onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      options.onError?.(error, variables);
    },
  });
}

/**
 * Hook para invalidar queries manualmente
 * Útil para sincronização manual após reconexão
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateByKey: (queryKey: unknown[]) =>
      queryClient.invalidateQueries({ queryKey }),
    refetchAll: () => queryClient.refetchQueries(),
  };
}
