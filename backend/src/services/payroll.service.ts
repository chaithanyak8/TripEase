import { prisma } from '../prisma/client.js';
import { salaryService } from './salary.service.js';
import { Payroll, PayrollStatus, NotificationType } from '@prisma/client';

export interface PayrollForecastResult {
  month: number;
  year: number;
  isEstimate: boolean;
  estimateNotice: string;
  totalActiveEmployees: number;
  estimatedGrossPayroll: number;
  estimatedNetPayroll: number;
  currentProcessedPayroll: number;
  overtimeImpact: number;
  absenceImpact: number;
  payrollVariance: number;
}

export class PayrollService {
  /**
   * Calculate payroll for a month & year and save/update as DRAFT
   */
  async calculatePayroll(
    month: number,
    year: number,
    employeeIds?: number[]
  ): Promise<Payroll[]> {
    const employees = await prisma.employee.findMany({
      where: {
        status: { in: ['ACTIVE', 'ON_NOTICE'] },
        ...(employeeIds && employeeIds.length > 0 ? { id: { in: employeeIds } } : {}),
      },
    });

    const results: Payroll[] = [];

    for (const emp of employees) {
      const calc = await salaryService.calculateSalary(emp.id, month, year);

      // Upsert payroll in DRAFT status
      const record = await prisma.payroll.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year,
          },
        },
        create: {
          employeeId: emp.id,
          month,
          year,
          basicSalary: calc.basicSalary,
          totalAllowances: calc.totalAllowances,
          overtimePay: calc.overtimePay,
          grossSalary: calc.grossSalary,
          leaveDeduction: calc.unpaidLeaveDeduction,
          lateDeduction: calc.lateDeduction,
          loanDeduction: calc.loanDeduction,
          otherDeduction: calc.otherDeduction,
          totalDeductions: calc.totalDeductions,
          netSalary: calc.netSalary,
          status: PayrollStatus.DRAFT,
        },
        update: {
          basicSalary: calc.basicSalary,
          totalAllowances: calc.totalAllowances,
          overtimePay: calc.overtimePay,
          grossSalary: calc.grossSalary,
          leaveDeduction: calc.unpaidLeaveDeduction,
          lateDeduction: calc.lateDeduction,
          loanDeduction: calc.loanDeduction,
          otherDeduction: calc.otherDeduction,
          totalDeductions: calc.totalDeductions,
          netSalary: calc.netSalary,
          // If already PAID or PROCESSED, keep status unless forced
        },
      });

      results.push(record);
    }

    return results;
  }

  /**
   * Process payroll (sets status to PROCESSED, generates Payslip, notifications)
   */
  async processPayroll(
    month: number,
    year: number,
    processedBy: number,
    employeeIds?: number[]
  ): Promise<Payroll[]> {
    // 1. Calculate if not already calculated
    const existing = await prisma.payroll.findMany({
      where: {
        month,
        year,
        ...(employeeIds && employeeIds.length > 0 ? { employeeId: { in: employeeIds } } : {}),
      },
      include: { employee: true },
    });

    let payrollsToProcess = existing;
    if (payrollsToProcess.length === 0) {
      payrollsToProcess = await this.calculatePayroll(month, year, employeeIds);
    }

    const processedList: Payroll[] = [];

    for (const item of payrollsToProcess) {
      const updated = await prisma.payroll.update({
        where: { id: item.id },
        data: {
          status: PayrollStatus.PROCESSED,
          processedAt: new Date(),
          processedBy,
        },
        include: { employee: { include: { user: true } } },
      });

      // Generate Payslip record
      const padMonth = String(month).padStart(2, '0');
      const payslipNumber = `PS-${year}${padMonth}-${item.employeeId}`;

      await prisma.payslip.upsert({
        where: { payrollId: item.id },
        create: {
          payrollId: item.id,
          employeeId: item.employeeId,
          payslipNumber,
          month,
          year,
          generatedAt: new Date(),
        },
        update: {
          generatedAt: new Date(),
        },
      });

      // Mark associated overtime as PAID
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      await prisma.overtime.updateMany({
        where: {
          employeeId: item.employeeId,
          date: { gte: startDate, lte: endDate },
          status: 'APPROVED',
        },
        data: { status: 'PAID' },
      });

      // Notify employee if user account exists
      if (updated.employee?.userId) {
        await prisma.notification.create({
          data: {
            userId: updated.employee.userId,
            title: 'Payroll Processed',
            message: `Your payslip for ${padMonth}/${year} has been processed. Net salary: ₹${Number(item.netSalary).toLocaleString('en-IN')}`,
            type: NotificationType.PAYROLL,
          },
        });
      }

      processedList.push(updated);
    }

    return processedList;
  }

  /**
   * Forecast payroll estimation
   */
  async getPayrollForecast(month: number, year: number): Promise<PayrollForecastResult> {
    const employees = await prisma.employee.findMany({
      where: { status: { in: ['ACTIVE', 'ON_NOTICE'] } },
    });

    let totalGross = 0;
    let totalNet = 0;
    let totalOtImpact = 0;
    let totalAbsenceImpact = 0;

    for (const emp of employees) {
      const calc = await salaryService.calculateSalary(emp.id, month, year);
      totalGross += calc.grossSalary;
      totalNet += calc.netSalary;
      totalOtImpact += calc.overtimePay;
      totalAbsenceImpact += calc.unpaidLeaveDeduction + calc.lateDeduction;
    }

    // Processed payroll in database
    const processed = await prisma.payroll.findMany({
      where: {
        month,
        year,
        status: { in: ['PROCESSED', 'PAID'] },
      },
    });

    const currentProcessedPayroll = processed.reduce(
      (sum, p) => sum + Number(p.netSalary),
      0
    );

    const payrollVariance = Number(
      (totalNet - currentProcessedPayroll).toFixed(2)
    );

    return {
      month,
      year,
      isEstimate: true,
      estimateNotice: 'ESTIMATE: This projection is dynamically calculated based on current active headcount, salary structure, and recorded attendance.',
      totalActiveEmployees: employees.length,
      estimatedGrossPayroll: Number(totalGross.toFixed(2)),
      estimatedNetPayroll: Number(totalNet.toFixed(2)),
      currentProcessedPayroll: Number(currentProcessedPayroll.toFixed(2)),
      overtimeImpact: Number(totalOtImpact.toFixed(2)),
      absenceImpact: Number(totalAbsenceImpact.toFixed(2)),
      payrollVariance,
    };
  }
}

export const payrollService = new PayrollService();
