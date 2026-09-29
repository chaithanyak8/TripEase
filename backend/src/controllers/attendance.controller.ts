import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { attendanceService } from '../services/attendance.service.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/audit.service.js';
import { enforceEmployeeAccess } from '../middleware/auth.js';
import { Role } from '@prisma/client';

export class AttendanceController {
  async checkIn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Only employees can check in', 403, 'NOT_AN_EMPLOYEE');
        return;
      }

      const { notes } = req.body;
      const attendance = await attendanceService.checkIn(employeeId, new Date(), notes);

      await recordAuditLog({
        userId: req.user?.id,
        action: 'CHECK_IN',
        entity: 'Attendance',
        entityId: String(attendance.id),
        details: { checkIn: attendance.checkIn, lateMinutes: attendance.lateMinutes },
        ipAddress: req.ip,
      });

      sendSuccess(res, attendance, 'Attendance checked in successfully', 201);
    } catch (error: any) {
      sendError(
        res,
        error.message || 'Check-in failed',
        error.statusCode || 500,
        error.errorCode
      );
    }
  }

  async checkOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Only employees can check out', 403, 'NOT_AN_EMPLOYEE');
        return;
      }

      const { breakMinutes, notes } = req.body;
      const attendance = await attendanceService.checkOut(
        employeeId,
        new Date(),
        breakMinutes,
        notes
      );

      await recordAuditLog({
        userId: req.user?.id,
        action: 'CHECK_OUT',
        entity: 'Attendance',
        entityId: String(attendance.id),
        details: { checkOut: attendance.checkOut, workingMinutes: attendance.workingMinutes },
        ipAddress: req.ip,
      });

      sendSuccess(res, attendance, 'Attendance checked out successfully');
    } catch (error: any) {
      sendError(
        res,
        error.message || 'Check-out failed',
        error.statusCode || 500,
        error.errorCode
      );
    }
  }

  async getMyAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Employee account not found', 403);
        return;
      }

      const { month, year, startDate, endDate } = req.query;

      const where: any = { employeeId };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(String(startDate)),
          lte: new Date(String(endDate)),
        };
      } else if (month && year) {
        const m = Number(month);
        const y = Number(year);
        where.date = {
          gte: new Date(y, m - 1, 1),
          lte: new Date(y, m, 0, 23, 59, 59),
        };
      }

      const records = await prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      sendSuccess(res, records, 'My attendance records fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch attendance', 500);
    }
  }

  async getAllAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { employeeId, departmentId, date, status, month, year } = req.query;

      // If regular employee, force isolation
      if (req.user?.role === Role.EMPLOYEE) {
        return this.getMyAttendance(req, res);
      }

      const where: any = {};

      if (employeeId) {
        where.employeeId = Number(employeeId);
      }

      if (departmentId) {
        where.employee = { departmentId: Number(departmentId) };
      }

      if (date) {
        const d = new Date(String(date));
        where.date = attendanceService.normalizeDate(d);
      } else if (month && year) {
        const m = Number(month);
        const y = Number(year);
        where.date = {
          gte: new Date(y, m - 1, 1),
          lte: new Date(y, m, 0, 23, 59, 59),
        };
      }

      if (status) {
        where.status = status;
      }

      const records = await prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              designation: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
      });

      sendSuccess(res, records, 'Attendance records fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch attendance', 500);
    }
  }

  async getAttendanceById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const record = await prisma.attendance.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!record) {
        sendError(res, 'Attendance record not found', 404);
        return;
      }

      if (!enforceEmployeeAccess(record.employeeId, req, res)) return;

      sendSuccess(res, record, 'Attendance details fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch attendance record', 500);
    }
  }

  async updateAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { checkIn, checkOut, breakMinutes, workingMinutes, lateMinutes, overtimeMinutes, status, notes } = req.body;

      const existing = await prisma.attendance.findUnique({ where: { id } });
      if (!existing) {
        sendError(res, 'Attendance record not found', 404);
        return;
      }

      const updated = await prisma.attendance.update({
        where: { id },
        data: {
          checkIn: checkIn ? new Date(checkIn) : existing.checkIn,
          checkOut: checkOut ? new Date(checkOut) : existing.checkOut,
          breakMinutes: breakMinutes !== undefined ? breakMinutes : existing.breakMinutes,
          workingMinutes: workingMinutes !== undefined ? workingMinutes : existing.workingMinutes,
          lateMinutes: lateMinutes !== undefined ? lateMinutes : existing.lateMinutes,
          overtimeMinutes: overtimeMinutes !== undefined ? overtimeMinutes : existing.overtimeMinutes,
          status: status || existing.status,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });

      await recordAuditLog({
        userId: req.user?.id,
        action: 'ATTENDANCE_UPDATED',
        entity: 'Attendance',
        entityId: String(id),
        details: { changes: req.body },
        ipAddress: req.ip,
      });

      sendSuccess(res, updated, 'Attendance updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update attendance', 500);
    }
  }

  async deleteAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await prisma.attendance.delete({ where: { id } });

      await recordAuditLog({
        userId: req.user?.id,
        action: 'ATTENDANCE_DELETED',
        entity: 'Attendance',
        entityId: String(id),
        ipAddress: req.ip,
      });

      sendSuccess(res, {}, 'Attendance record deleted');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete attendance', 500);
    }
  }

  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const today = attendanceService.normalizeDate(new Date());

      const totalEmployees = await prisma.employee.count({
        where: { status: { in: ['ACTIVE', 'ON_NOTICE'] } },
      });

      const todayRecords = await prisma.attendance.findMany({
        where: { date: today },
      });

      const presentToday = todayRecords.filter(
        (r) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length;
      const absentToday = todayRecords.filter((r) => r.status === 'ABSENT').length;
      const lateToday = todayRecords.filter((r) => r.status === 'LATE' || r.lateMinutes > 0).length;
      const onLeaveToday = todayRecords.filter((r) => r.status === 'LEAVE').length;

      const attendanceRate = totalEmployees > 0
        ? Number(((presentToday / totalEmployees) * 100).toFixed(1))
        : 0;

      sendSuccess(res, {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        onLeaveToday,
        attendanceRate,
      }, 'Today attendance summary');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch summary', 500);
    }
  }

  async getMonthly(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      let where: any = {
        date: { gte: startDate, lte: endDate },
      };

      if (req.user?.role === Role.EMPLOYEE) {
        where.employeeId = req.user.employeeId;
      }

      const records = await prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: { id: true, fullName: true, employeeCode: true, department: true },
          },
        },
        orderBy: { date: 'asc' },
      });

      sendSuccess(res, records, `Monthly attendance for ${month}/${year}`);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch monthly attendance', 500);
    }
  }
}

export const attendanceController = new AttendanceController();
