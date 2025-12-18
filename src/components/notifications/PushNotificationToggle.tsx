'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Bell, BellOff, AlertCircle, X } from 'lucide-react';

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('push-notification-dismissed') === 'true';
    }
    return false;
  });
  const [showBlockedMessage, setShowBlockedMessage] = useState(true);

  if (!isSupported || isDismissed) {
    return null;
  }

  const handleReject = () => {
    localStorage.setItem('push-notification-dismissed', 'true');
    setIsDismissed(true);
  };

  const handleSubscribe = async () => {
    await subscribe();
    // Hide the card after subscribing
    localStorage.setItem('push-notification-dismissed', 'true');
    setIsDismissed(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba notificações mesmo quando não estiver usando o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-teal-600">
              <Bell className="h-4 w-4" />
              <span>Notificações ativadas</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribe}
              disabled={isLoading}
            >
              <BellOff className="h-4 w-4" />
              {isLoading ? 'Desativando...' : 'Desativar'}
            </Button>
          </div>
        ) : permission === 'denied' ? (
          showBlockedMessage && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md relative">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Notificações bloqueadas</p>
                  <p className="text-xs text-amber-700">
                    Você bloqueou as notificações. Para ativar, clique no ícone de cadeado ao lado da barra de endereço do navegador e permita as notificações.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0 hover:bg-amber-100"
                  onClick={() => setShowBlockedMessage(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground">
              Ative para receber notificações em tempo real
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                size="sm"
                className="flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                {isLoading ? 'Ativando...' : 'Aceitar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isLoading}
                size="sm"
                className="flex-1"
              >
                Agora não
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
