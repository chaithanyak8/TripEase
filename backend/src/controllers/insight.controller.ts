import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { insightService } from '../services/insight.service.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export class InsightController {
  async getAttendanceInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const days = Number(req.query.days) || 30;
      const data = await insightService.getAttendanceInsights(days);
      sendSuccess(res, data, 'Attendance insights');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch attendance insights', 500);
    }
  }

  async getOvertimeInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const days = Number(req.query.days) || 30;
      const data = await insightService.getOvertimeInsights(days);
      sendSuccess(res, data, 'Overtime insights');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch overtime insights', 500);
    }
  }

  async getPayrollInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const year = Number(req.query.year) || new Date().getFullYear();
      const data = await insightService.getPayrollInsights(year);
      sendSuccess(res, data, 'Payroll insights');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch payroll insights', 500);
    }
  }

  async getWorkforceIntelligence(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await insightService.getWorkforceIntelligence();
      sendSuccess(res, data, 'Workforce intelligence metrics');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch workforce intelligence', 500);
    }
  }
}

export const insightController = new InsightController();
