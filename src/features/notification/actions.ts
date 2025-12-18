'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';

export interface CreateNotificationInput {
  title: string;
  message: string;
  link?: string;
}

/**
 * Create notification for all users in the family
 * Used after important actions (create income, expense, etc.)
 */
export async function createNotificationForFamily(data: CreateNotificationInput) {
  try {
    const user = await requireAuth();

    // Get all users from the same family (except the current user)
    const familyUsers = await prisma.user.findMany({
      where: {
        familyId: user.familyId,
        id: { not: user.id }, // Don't notify the user who made the action
      },
      select: {
        id: true,
      },
    });

    if (familyUsers.length === 0) {
      return { success: true, data: [] };
    }

    // Create notifications for all family members
    const notifications = await prisma.notification.createMany({
      data: familyUsers.map((familyUser) => ({
        userId: familyUser.id,
        familyId: user.familyId,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      })),
    });

    revalidatePath('/notifications');

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    console.error('Create notification error:', error);
    return {
      success: false,
      error: 'Erro ao criar notificação',
    };
  }
}

/**
 * Get all notifications for current user
 */
export async function getNotifications() {
  try {
    const user = await requireAuth();

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 notifications
    });

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    console.error('Get notifications error:', error);
    return {
      success: false,
      error: 'Erro ao buscar notificações',
      data: [],
    };
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount() {
  try {
    const user = await requireAuth();

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return {
      success: true,
      data: count,
    };
  } catch (error) {
    console.error('Get unread count error:', error);
    return {
      success: false,
      error: 'Erro ao contar notificações',
      data: 0,
    };
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    const user = await requireAuth();

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    if (!notification) {
      return {
        success: false,
        error: 'Notificação não encontrada',
      };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    revalidatePath('/notifications');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Mark as read error:', error);
    return {
      success: false,
      error: 'Erro ao marcar como lida',
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  try {
    const user = await requireAuth();

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/notifications');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return {
      success: false,
      error: 'Erro ao marcar todas como lidas',
    };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const user = await requireAuth();

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    if (!notification) {
      return {
        success: false,
        error: 'Notificação não encontrada',
      };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    revalidatePath('/notifications');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete notification error:', error);
    return {
      success: false,
      error: 'Erro ao deletar notificação',
    };
  }
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead() {
  try {
    const user = await requireAuth();

    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        isRead: true,
      },
    });

    revalidatePath('/notifications');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete all read error:', error);
    return {
      success: false,
      error: 'Erro ao deletar notificações',
    };
  }
}
