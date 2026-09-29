import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      });

      sendSuccess(res, { notifications, unreadCount }, 'Notifications fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch notifications', 500);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const notification = await prisma.notification.findUnique({ where: { id } });

      if (!notification) {
        sendError(res, 'Notification not found', 404);
        return;
      }

      if (notification.userId !== req.user?.id) {
        sendError(res, 'Access denied', 403);
        return;
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      sendSuccess(res, updated, 'Notification marked as read');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update notification', 500);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true },
      });

      sendSuccess(res, {}, 'All notifications marked as read');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to mark all as read', 500);
    }
  }
}

export const notificationController = new NotificationController();
