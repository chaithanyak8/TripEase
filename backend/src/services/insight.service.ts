import { prisma } from '../prisma/client.js';
import { payrollService } from './payroll.service.js';

export interface EmployeeRiskIndicator {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  attendanceRate: number; // percentage e.g. 92.5
  lateCount: number;
  absentCount: number;
  overtimeHours: number;
  status: 'NORMAL' | 'WATCH' | 'ATTENTION_REQUIRED';
  ruleTriggered: string;
}

export class InsightService {
  /**
   * Explanatory thresholds for risk indicators
   */
  getThresholds() {
    return {
      ATTENTION_REQUIRED: {
        condition: 'Attendance rate < 75% OR Late count >= 5 days in 30-day window',
        actionRequired: 'Immediate manager check-in / HR review',
      },
      WATCH: {
        condition: 'Attendance rate between 75% and 85% OR Late count between 3 and 4 days',
        actionRequired: 'Monitor attendance and send reminder notification',
      },
      NORMAL: {
        condition: 'Attendance rate >= 85% AND Late count < 3 days',
        actionRequired: 'Satisfactory performance',
      },
    };
  }

  async getAttendanceInsights(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const attendances = await prisma.attendance.findMany({
      where: { date: { gte: cutoff } },
      include: { employee: { include: { department: true } } },
    });

    const totalRecords = attendances.length;
    const presentCount = attendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const lateCount = attendances.filter((a) => a.status === 'LATE' || a.lateMinutes > 0).length;

    const attendanceRate = totalRecords > 0
      ? Number(((presentCount / totalRecords) * 100).toFixed(1))
      : 0;
    const absenteeismRate = totalRecords > 0
      ? Number(((absentCount / totalRecords) * 100).toFixed(1))
      : 0;

    // Department breakdown
    const deptMap = new Map<string, { total: number; present: number; late: number; absent: number }>();

    for (const a of attendances) {
      const deptName = a.employee.department?.name || 'General';
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, { total: 0, present: 0, late: 0, absent: 0 });
      }
      const d = deptMap.get(deptName)!;
      d.total += 1;
      if (a.status === 'PRESENT' || a.status === 'LATE') d.present += 1;
      if (a.status === 'LATE' || a.lateMinutes > 0) d.late += 1;
      if (a.status === 'ABSENT') d.absent += 1;
    }

    const departmentAttendance = Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      attendanceRate: data.total > 0 ? Number(((data.present / data.total) * 100).toFixed(1)) : 0,
      totalRecords: data.total,
      presentCount: data.present,
      lateCount: data.late,
      absentCount: data.absent,
    }));

    return {
      windowDays: days,
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      absenteeismRate,
      departmentAttendance,
    };
  }

  async getOvertimeInsights(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const overtimes = await prisma.overtime.findMany({
      where: { date: { gte: cutoff } },
      include: { employee: { include: { department: true } } },
    });

    let totalMinutes = 0;
    let totalCost = 0;
    let approvedMinutes = 0;
    let approvedCost = 0;

    const deptMap = new Map<string, { minutes: number; cost: number }>();

    for (const ot of overtimes) {
      totalMinutes += ot.minutes;
      totalCost += Number(ot.amount);

      if (ot.status === 'APPROVED' || ot.status === 'PAID') {
        approvedMinutes += ot.minutes;
        approvedCost += Number(ot.amount);
      }

      const deptName = ot.employee.department?.name || 'General';
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, { minutes: 0, cost: 0 });
      }
      const d = deptMap.get(deptName)!;
      d.minutes += ot.minutes;
      d.cost += Number(ot.amount);
    }

    const departmentOvertime = Array.from(deptMap.entries()).map(([department, d]) => ({
      department,
      hours: Number((d.minutes / 60).toFixed(1)),
      cost: Number(d.cost.toFixed(2)),
    }));

    return {
      windowDays: days,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      totalCost: Number(totalCost.toFixed(2)),
      approvedHours: Number((approvedMinutes / 60).toFixed(1)),
      approvedCost: Number(approvedCost.toFixed(2)),
      totalEntries: overtimes.length,
      departmentOvertime,
    };
  }

  async getPayrollInsights(year: number = new Date().getFullYear()) {
    const payrolls = await prisma.payroll.findMany({
      where: { year },
      include: { employee: { include: { department: true } } },
    });

    // Monthly trend
    const monthTrend = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      grossTotal: 0,
      netTotal: 0,
      deductionsTotal: 0,
      overtimeTotal: 0,
      processedCount: 0,
    }));

    for (const p of payrolls) {
      const m = p.month - 1;
      if (m >= 0 && m < 12) {
        monthTrend[m].grossTotal += Number(p.grossSalary);
        monthTrend[m].netTotal += Number(p.netSalary);
        monthTrend[m].deductionsTotal += Number(p.totalDeductions);
        monthTrend[m].overtimeTotal += Number(p.overtimePay);
        monthTrend[m].processedCount += 1;
      }
    }

    const currentMonth = new Date().getMonth() + 1;
    const forecast = await payrollService.getPayrollForecast(currentMonth, year);

    return {
      year,
      monthlyTrends: monthTrend.map((t) => ({
        ...t,
        grossTotal: Number(t.grossTotal.toFixed(2)),
        netTotal: Number(t.netTotal.toFixed(2)),
        deductionsTotal: Number(t.deductionsTotal.toFixed(2)),
        overtimeTotal: Number(t.overtimeTotal.toFixed(2)),
      })),
      forecast,
    };
  }

  async getWorkforceIntelligence() {
    const days = 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const employees = await prisma.employee.findMany({
      where: { status: { in: ['ACTIVE', 'ON_NOTICE'] } },
      include: {
        department: true,
        attendances: { where: { date: { gte: cutoff } } },
        overtimes: { where: { date: { gte: cutoff } } },
      },
    });

    const indicators: EmployeeRiskIndicator[] = [];

    for (const emp of employees) {
      const total = emp.attendances.length;
      const present = emp.attendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const absent = emp.attendances.filter((a) => a.status === 'ABSENT').length;
      const late = emp.attendances.filter((a) => a.status === 'LATE' || a.lateMinutes > 0).length;
      const otMinutes = emp.overtimes.reduce((sum, o) => sum + o.minutes, 0);

      const rate = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100;

      let status: 'NORMAL' | 'WATCH' | 'ATTENTION_REQUIRED' = 'NORMAL';
      let ruleTriggered = 'Regular attendance maintained';

      if (rate < 75 || late >= 5) {
        status = 'ATTENTION_REQUIRED';
        ruleTriggered = rate < 75
          ? `Low attendance rate (${rate}% < 75%)`
          : `Frequent late arrivals (${late} >= 5 times)`;
      } else if (rate < 85 || late >= 3) {
        status = 'WATCH';
        ruleTriggered = rate < 85
          ? `Borderline attendance (${rate}% < 85%)`
          : `Elevated late arrivals (${late} times)`;
      }

      indicators.push({
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeCode: emp.employeeCode,
        department: emp.department?.name || 'General',
        attendanceRate: rate,
        lateCount: late,
        absentCount: absent,
        overtimeHours: Number((otMinutes / 60).toFixed(1)),
        status,
        ruleTriggered,
      });
    }

    const attendanceInsights = await this.getAttendanceInsights(days);
    const overtimeInsights = await this.getOvertimeInsights(days);
    const payrollInsights = await this.getPayrollInsights();

    return {
      thresholds: this.getThresholds(),
      employeeIndicators: indicators,
      summary: {
        totalEmployees: employees.length,
        attentionRequiredCount: indicators.filter((i) => i.status === 'ATTENTION_REQUIRED').length,
        watchCount: indicators.filter((i) => i.status === 'WATCH').length,
        normalCount: indicators.filter((i) => i.status === 'NORMAL').length,
      },
      attendance: attendanceInsights,
      overtime: overtimeInsights,
      payroll: payrollInsights,
    };
  }
}

export const insightService = new InsightService();
