import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'noreply@financas.app'),
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: PushPayload
) {
  try {
    const subscriptionObject: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    await webpush.sendNotification(
      subscriptionObject,
      JSON.stringify(payload)
    );
    
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error };
  }
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
  prisma: PrismaClient
) {
  try {
    // Get all push subscriptions for the users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          payload
        )
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      sent: successCount,
      failed: failureCount,
    };
  } catch (error) {
    console.error('Send push to users error:', error);
    return {
      success: false,
      error,
    };
  }
}
