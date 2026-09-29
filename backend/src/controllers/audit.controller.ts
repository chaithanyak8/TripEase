import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export class AuditController {
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { action, entity, userId, limit = 100 } = req.query;

      const where: any = {};
      if (action) where.action = String(action);
      if (entity) where.entity = String(entity);
      if (userId) where.userId = Number(userId);

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, role: true, employee: { select: { fullName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      sendSuccess(res, logs, 'Audit logs fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch audit logs', 500);
    }
  }
}

export const auditController = new AuditController();
