import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';

export class NotificationsService {
  async getMyNotifications(userId: string) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return {
        notifications: notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getUserNotifications(userId);
      }
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw AppError.notFound('Notification not found');
      }

      if (notification.userId !== userId) {
        throw AppError.forbidden();
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return updated;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.markNotificationAsRead(notificationId, userId);
      }
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return { message: 'All notifications marked as read' };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.markAllNotificationsAsRead(userId);
      }
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
