import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { attendanceService } from '../services/attendance.service.js';
import { payrollService } from '../services/payroll.service.js';
import { salaryService } from '../services/salary.service.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { Role } from '@prisma/client';

export class DashboardController {
  async getAdminDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const today = attendanceService.normalizeDate(new Date());
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Total Active Employees
      const totalEmployees = await prisma.employee.count({
        where: { status: { in: ['ACTIVE', 'ON_NOTICE'] } },
      });

      // Today's attendance
      const todayRecords = await prisma.attendance.findMany({
        where: { date: today },
      });

      const presentToday = todayRecords.filter(
        (r) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length;
      const absentToday = todayRecords.filter((r) => r.status === 'ABSENT').length;
      const onLeaveToday = todayRecords.filter((r) => r.status === 'LEAVE').length;
      const lateEmployees = todayRecords.filter((r) => r.status === 'LATE' || r.lateMinutes > 0).length;

      const attendanceRate = totalEmployees > 0
        ? Number(((presentToday / totalEmployees) * 100).toFixed(1))
        : 0;

      // Overtime Hours this month
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      const monthlyOvertimes = await prisma.overtime.findMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: { in: ['APPROVED', 'PAID'] },
        },
      });

      const totalOtMinutes = monthlyOvertimes.reduce((sum, o) => sum + o.minutes, 0);
      const overtimeHours = Number((totalOtMinutes / 60).toFixed(1));

      // Monthly Payroll processed
      const monthlyPayrolls = await prisma.payroll.findMany({
        where: {
          month: currentMonth,
          year: currentYear,
          status: { in: ['PROCESSED', 'PAID'] },
        },
      });

      const monthlyPayroll = Number(
        monthlyPayrolls.reduce((sum, p) => sum + Number(p.netSalary), 0).toFixed(2)
      );

      // Payroll Forecast
      const payrollForecast = await payrollService.getPayrollForecast(currentMonth, currentYear);

      // Pending approvals count
      const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
      const pendingOvertimes = await prisma.overtime.count({ where: { status: 'PENDING' } });

      // Recent Audit logs
      const recentAudits = await prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      });

      sendSuccess(res, {
        totalEmployees,
        presentToday,
        absentToday,
        onLeave: onLeaveToday,
        lateEmployees,
        attendanceRate,
        overtimeHours,
        monthlyPayroll,
        payrollForecast,
        pendingLeaves,
        pendingOvertimes,
        recentAudits,
      }, 'Admin dashboard metrics');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch admin dashboard', 500);
    }
  }

  async getHrDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Reuses admin metrics + specific HR queue items
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
      const onLeaveToday = todayRecords.filter((r) => r.status === 'LEAVE').length;
      const lateToday = todayRecords.filter((r) => r.status === 'LATE' || r.lateMinutes > 0).length;

      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: { status: 'PENDING' },
        include: { employee: { include: { department: true } }, leaveType: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      const pendingOvertimes = await prisma.overtime.findMany({
        where: { status: 'PENDING' },
        include: { employee: { include: { department: true } } },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      const departments = await prisma.department.findMany({
        include: { _count: { select: { employees: true } } },
      });

      sendSuccess(res, {
        totalEmployees,
        presentToday,
        absentToday,
        onLeave: onLeaveToday,
        lateToday,
        attendanceRate: totalEmployees > 0 ? Number(((presentToday / totalEmployees) * 100).toFixed(1)) : 0,
        pendingLeaves,
        pendingOvertimes,
        departments: departments.map((d) => ({
          id: d.id,
          name: d.name,
          employeeCount: d._count.employees,
        })),
      }, 'HR dashboard metrics');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch HR dashboard', 500);
    }
  }

  async getEmployeeDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Employee profile not associated with this account', 404);
        return;
      }

      const today = attendanceService.normalizeDate(new Date());
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Today attendance
      const todayAttendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: today,
          },
        },
      });

      // Employee profile
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          department: true,
          manager: { select: { fullName: true, designation: true } },
          salaryStructures: {
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      });

      // Month stats
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      const monthAttendances = await prisma.attendance.findMany({
        where: {
          employeeId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      const daysPresent = monthAttendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const daysLate = monthAttendances.filter((a) => a.status === 'LATE' || a.lateMinutes > 0).length;
      const daysAbsent = monthAttendances.filter((a) => a.status === 'ABSENT').length;
      const totalRecorded = monthAttendances.length;
      const monthlyAttendanceRate = totalRecorded > 0
        ? Number(((daysPresent / totalRecorded) * 100).toFixed(1))
        : 100;

      // Leave Balances for current year
      const leaveBalances = await prisma.leaveBalance.findMany({
        where: { employeeId, year: currentYear },
        include: { leaveType: true },
      });

      // Recent payslips
      const recentPayslips = await prisma.payslip.findMany({
        where: { employeeId },
        include: { payroll: true },
        take: 3,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });

      // Pending leave & overtime requests
      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: { employeeId, status: 'PENDING' },
        include: { leaveType: true },
      });

      const pendingOvertimes = await prisma.overtime.findMany({
        where: { employeeId, status: 'PENDING' },
      });

      // Live salary breakdown projection
      const salaryProjection = await salaryService.calculateSalary(employeeId, currentMonth, currentYear);

      sendSuccess(res, {
        employee,
        todayAttendance,
        monthStats: {
          daysPresent,
          daysLate,
          daysAbsent,
          totalRecorded,
          monthlyAttendanceRate,
        },
        leaveBalances,
        recentPayslips,
        pendingRequests: {
          leaves: pendingLeaves,
          overtimes: pendingOvertimes,
        },
        salaryProjection,
      }, 'Employee dashboard metrics');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch employee dashboard', 500);
    }
  }
}

export const dashboardController = new DashboardController();
