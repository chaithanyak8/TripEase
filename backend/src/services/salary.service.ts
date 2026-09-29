import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';

export interface SalaryCalculationResult {
  employeeId: number;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  travelAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  totalAllowances: number;
  overtimeHours: number;
  overtimePay: number;
  grossSalary: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  lateMinutes: number;
  lateDeduction: number;
  loanDeduction: number;
  otherDeduction: number;
  totalDeductions: number;
  netSalary: number;
  dailyRate: number;
  hourlyRate: number;
}

export interface AttendanceToPayImpact {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  expectedSalary: number;
  attendanceImpact: number; // absence/half-day deduction
  leaveImpact: number;      // unpaid leave deduction
  lateImpact: number;       // late penalty deduction
  overtimeImpact: number;   // overtime addition
  finalSalary: number;
  totalWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLeave: number;
  lateDays: number;
  overtimeHours: number;
}

export class SalaryService {
  /**
   * Calculate full salary breakdown for a specific employee and month/year
   */
  async calculateSalary(
    employeeId: number,
    month: number,
    year: number
  ): Promise<SalaryCalculationResult> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        salaryStructures: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const structure = employee.salaryStructures[0];
    const basicSalary = structure
      ? Number(structure.basicSalary)
      : Number(employee.basicSalary);
    const hra = structure ? Number(structure.hra) : 0;
    const travelAllowance = structure ? Number(structure.travelAllowance) : 0;
    const medicalAllowance = structure ? Number(structure.medicalAllowance) : 0;
    const otherAllowance = structure ? Number(structure.otherAllowance) : 0;
    const customOtRate = structure ? Number(structure.overtimeRate) : 0;

    const totalAllowances = Number(
      (hra + travelAllowance + medicalAllowance + otherAllowance).toFixed(2)
    );

    // Get company settings
    const settings = await prisma.companySettings.findFirst();
    const defaultOtRate = settings ? Number(settings.defaultOvertimeRate) : 200;
    const effectiveOtRate = customOtRate > 0 ? customOtRate : defaultOtRate;

    // Standard monthly days for daily rate calculation
    const daysInMonth = new Date(year, month, 0).getDate();
    // Typical working days: 26 or days in month
    const standardWorkingDays = 26;
    const dailyRate = Number((basicSalary / standardWorkingDays).toFixed(2));
    const hourlyRate = Number((dailyRate / 8).toFixed(2));

    // Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Approved Overtime for this month
    const overtimes = await prisma.overtime.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
        status: { in: ['APPROVED', 'PAID'] },
      },
    });

    let totalOtMinutes = 0;
    let overtimePay = 0;
    for (const ot of overtimes) {
      totalOtMinutes += ot.minutes;
      overtimePay += Number(ot.amount);
    }
    const overtimeHours = Number((totalOtMinutes / 60).toFixed(2));
    overtimePay = Number(overtimePay.toFixed(2));

    // Attendance records for late minutes and absences
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    let totalLateMinutes = 0;
    for (const att of attendances) {
      totalLateMinutes += att.lateMinutes;
    }

    // Late deduction formula:
    // e.g., if late threshold exceeded (> 15 mins), deduct proportional hourly rate
    // Deduct hourly rate per 60 minutes of late
    const lateHours = totalLateMinutes / 60;
    const lateDeduction = Number((lateHours * hourlyRate).toFixed(2));

    // Approved unpaid leaves in this month
    const unpaidLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        leaveType: { isPaid: false },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    let unpaidLeaveDays = 0;
    for (const leave of unpaidLeaves) {
      unpaidLeaveDays += Number(leave.numberOfDays);
    }
    const unpaidLeaveDeduction = Number((unpaidLeaveDays * dailyRate).toFixed(2));

    const loanDeduction = 0;
    const otherDeduction = 0;

    const grossSalary = Number(
      (basicSalary + totalAllowances + overtimePay).toFixed(2)
    );

    const totalDeductions = Number(
      (unpaidLeaveDeduction + lateDeduction + loanDeduction + otherDeduction).toFixed(2)
    );

    const netSalary = Math.max(
      0,
      Number((grossSalary - totalDeductions).toFixed(2))
    );

    return {
      employeeId,
      month,
      year,
      basicSalary,
      hra,
      travelAllowance,
      medicalAllowance,
      otherAllowance,
      totalAllowances,
      overtimeHours,
      overtimePay,
      grossSalary,
      unpaidLeaveDays,
      unpaidLeaveDeduction,
      lateMinutes: totalLateMinutes,
      lateDeduction,
      loanDeduction,
      otherDeduction,
      totalDeductions,
      netSalary,
      dailyRate,
      hourlyRate,
    };
  }

  /**
   * Dedicated Attendance-to-Pay Impact analysis service for the frontend feature
   */
  async getAttendanceToPayImpact(
    month: number,
    year: number,
    employeeId?: number
  ): Promise<AttendanceToPayImpact[]> {
    const employees = await prisma.employee.findMany({
      where: {
        status: { in: ['ACTIVE', 'ON_NOTICE'] },
        ...(employeeId ? { id: employeeId } : {}),
      },
      include: {
        department: true,
      },
    });

    const results: AttendanceToPayImpact[] = [];

    for (const emp of employees) {
      const calc = await this.calculateSalary(emp.id, month, year);
      const expectedSalary = Number(
        (calc.basicSalary + calc.totalAllowances).toFixed(2)
      );

      // Attendance records breakdown
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      const daysPresent = attendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const daysAbsent = attendances.filter((a) => a.status === 'ABSENT').length;
      const daysLeave = attendances.filter((a) => a.status === 'LEAVE').length;
      const lateDays = attendances.filter((a) => a.status === 'LATE' || a.lateMinutes > 0).length;

      // Absence impact (unpaid absences)
      const absenceDeduction = Number((daysAbsent * calc.dailyRate).toFixed(2));
      const totalAttendanceImpact = Number(
        (absenceDeduction + calc.unpaidLeaveDeduction).toFixed(2)
      );

      results.push({
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeCode: emp.employeeCode,
        department: emp.department?.name || 'General',
        expectedSalary,
        attendanceImpact: totalAttendanceImpact,
        leaveImpact: calc.unpaidLeaveDeduction,
        lateImpact: calc.lateDeduction,
        overtimeImpact: calc.overtimePay,
        finalSalary: calc.netSalary,
        totalWorkingDays: 26,
        daysPresent,
        daysAbsent,
        daysLeave,
        lateDays,
        overtimeHours: calc.overtimeHours,
      });
    }

    return results;
  }
}

export const salaryService = new SalaryService();
