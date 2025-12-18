'use client';

import { useState, useEffect } from 'react';
import { WifiOff, CloudOff, Cloud, RefreshCw } from 'lucide-react';
import { useUnsyncedCount, useSync } from '@/hooks/use-offline';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);
  const unsyncedCount = useUnsyncedCount();
  const sync = useSync();

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada!', {
        description: 'Sincronizando dados...',
      });
      if (unsyncedCount > 0) {
        sync.mutate();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está offline', {
        description: 'Suas alterações serão sincronizadas quando voltar online.',
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unsyncedCount]);

  const handleManualSync = () => {
    if (!isOnline) {
      toast.error('Você está offline', {
        description: 'Conecte-se à internet para sincronizar.',
      });
      return;
    }
    sync.mutate(undefined, {
      onSuccess: () => {
        toast.success('Dados sincronizados!');
      },
      onError: () => {
        toast.error('Erro ao sincronizar dados');
      },
    });
  };

  if (!mounted) {
    // Evita hydration error: não renderiza nada até montar no client
    return null;
  }

  if (isOnline && unsyncedCount === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-teal-600">
        <Cloud className="h-4 w-4" />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100">
          <CloudOff className="h-4 w-4" />
          <span className="text-xs font-medium hidden sm:inline">Offline</span>
        </div>
      ) : unsyncedCount > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100">
            <WifiOff className="h-4 w-4" />
            <span className="text-xs font-medium">
              {unsyncedCount} {unsyncedCount === 1 ? 'alteração' : 'alterações'} não sincronizada
              {unsyncedCount > 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSync}
            disabled={sync.isPending}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
