'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { markAsRead, deleteNotification } from '@/features/notification/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Bell, Trash2, Check, ExternalLink, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: Date;
}

interface NotificationsClientProps {
  notifications: Notification[];
}

export function NotificationsClient({ notifications }: NotificationsClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Notificação marcada como lida');
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) return;

    const result = await deleteNotification(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Notificação excluída');
      router.refresh();
    }
  };

  const handleNavigate = (link: string | null | undefined, id: string) => {
    if (link) {
      handleMarkAsRead(id);
      router.push(link);
    }
  };

  const getTypeColor = () => {
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getTypeIcon = () => {
    return 'ℹ';
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <div>
                <CardTitle>Notificações</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {unreadCount > 0 ? (
                    <>
                      Você tem <span className="font-semibold text-primary">{unreadCount}</span>{' '}
                      {unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}
                    </>
                  ) : (
                    'Todas as notificações foram lidas'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Não lidas ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Lidas ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <NotificationsList
                notifications={filteredNotifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
                getTypeColor={getTypeColor}
                getTypeIcon={getTypeIcon}
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              <NotificationsList
                notifications={filteredNotifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
                getTypeColor={getTypeColor}
                getTypeIcon={getTypeIcon}
              />
            </TabsContent>

            <TabsContent value="read" className="mt-0">
              <NotificationsList
                notifications={filteredNotifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
                getTypeColor={getTypeColor}
                getTypeIcon={getTypeIcon}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link: string | null | undefined, id: string) => void;
  getTypeColor: () => string;
  getTypeIcon: () => string;
}

function NotificationsList({
  notifications,
  onMarkAsRead,
  onDelete,
  onNavigate,
  getTypeColor,
  getTypeIcon,
}: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BellOff className="h-12 w-12 mb-3 opacity-50" />
        <p>Nenhuma notificação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 transition-colors ${
            !notification.isRead ? 'bg-muted/50 border-primary/20' : 'bg-background'
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Type Badge */}
            <div
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold text-lg ${getTypeColor()}`}
            >
              {getTypeIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {notification.title}
                    {!notification.isRead && (
                      <span className="ml-2 inline-block w-2 h-2 bg-primary rounded-full" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {notification.link && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate(notification.link, notification.id)}
                  title="Abrir link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMarkAsRead(notification.id)}
                  title="Marcar como lida"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(notification.id)}
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
