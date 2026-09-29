import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/audit.service.js';

export class SettingsController {
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let settings = await prisma.companySettings.findFirst();

      if (!settings) {
        settings = await prisma.companySettings.create({
          data: {
            companyName: 'WorkForce360 Technologies India Pvt Ltd',
            companyAddress: 'Bengaluru, Karnataka, India',
            companyEmail: 'contact@workforce360.com',
            companyPhone: '+91 80 2345 6789',
            officeStartTime: '09:30',
            officeEndTime: '18:30',
            breakMinutes: 60,
            requiredWorkingMinutes: 480,
            lateThresholdMinutes: 15,
            defaultOvertimeRate: 200.00,
          },
        });
      }

      sendSuccess(res, settings, 'Company settings fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch settings', 500);
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = req.body;
      const settings = await prisma.companySettings.findFirst();

      let updated;
      if (settings) {
        updated = await prisma.companySettings.update({
          where: { id: settings.id },
          data,
        });
      } else {
        updated = await prisma.companySettings.create({ data });
      }

      await recordAuditLog({
        userId: req.user?.id,
        action: 'SETTINGS_UPDATED',
        entity: 'CompanySettings',
        entityId: String(updated.id),
        details: { changes: Object.keys(data) },
        ipAddress: req.ip,
      });

      sendSuccess(res, updated, 'Company settings updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update settings', 500);
    }
  }
}

export const settingsController = new SettingsController();
