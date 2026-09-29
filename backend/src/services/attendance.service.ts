import { prisma } from '../prisma/client.js';
import { Attendance, AttendanceStatus } from '@prisma/client';

export class AttendanceService {
  /**
   * Normalize date to YYYY-MM-DD midnight UTC
   */
  normalizeDate(d: Date = new Date()): Date {
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = d.getDate();
    return new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
  }

  /**
   * Parse "HH:mm" on today's local date
   */
  getOfficeTimeToday(timeStr: string, baseDate: Date = new Date()): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  async checkIn(
    employeeId: number,
    checkInTime: Date = new Date(),
    notes?: string
  ): Promise<Attendance> {
    const today = this.normalizeDate(checkInTime);

    // 3. Search for existing attendance
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    // 4. Reject duplicate check-in
    if (existing && existing.checkIn) {
      const error: any = new Error('You have already checked in today');
      error.statusCode = 409;
      error.errorCode = 'DUPLICATE_CHECK_IN';
      throw error;
    }

    // 6. Get company settings
    const settings = await prisma.companySettings.findFirst();
    const officeStartTimeStr = settings?.officeStartTime || '09:30';
    const lateThresholdMinutes = settings?.lateThresholdMinutes ?? 15;

    // 7. Determine whether employee is late
    const scheduledStart = this.getOfficeTimeToday(officeStartTimeStr, checkInTime);
    const thresholdTime = new Date(scheduledStart.getTime() + lateThresholdMinutes * 60 * 1000);

    let lateMinutes = 0;
    let status: AttendanceStatus = AttendanceStatus.PRESENT;

    if (checkInTime.getTime() > thresholdTime.getTime()) {
      lateMinutes = Math.max(0, Math.round((checkInTime.getTime() - scheduledStart.getTime()) / (60 * 1000)));
      status = AttendanceStatus.LATE;
    }

    if (existing) {
      return await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: checkInTime,
          lateMinutes,
          status,
          notes: notes ? (existing.notes ? `${existing.notes}; ${notes}` : notes) : existing.notes,
        },
      });
    }

    return await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: checkInTime,
        breakMinutes: 0,
        workingMinutes: 0,
        lateMinutes,
        overtimeMinutes: 0,
        status,
        notes,
      },
    });
  }

  async checkOut(
    employeeId: number,
    checkOutTime: Date = new Date(),
    breakMinutes?: number,
    notes?: string
  ): Promise<Attendance> {
    const today = this.normalizeDate(checkOutTime);

    // 2. Find today's attendance
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    // 3. Reject if check-in does not exist
    if (!existing || !existing.checkIn) {
      const error: any = new Error('No check-in record found for today. Please check in first.');
      error.statusCode = 404;
      error.errorCode = 'CHECKIN_NOT_FOUND';
      throw error;
    }

    // 4. Reject duplicate checkout
    if (existing.checkOut) {
      const error: any = new Error('You have already checked out today');
      error.statusCode = 409;
      error.errorCode = 'ALREADY_CHECKED_OUT';
      throw error;
    }

    // 6. Get company settings
    const settings = await prisma.companySettings.findFirst();
    const effectiveBreakMinutes = breakMinutes !== undefined
      ? breakMinutes
      : (settings?.breakMinutes ?? 60);
    const requiredWorkingMinutes = settings?.requiredWorkingMinutes ?? 480;
    const defaultOtRate = settings?.defaultOvertimeRate ?? 200;

    // Formula: workingMinutes = checkOut - checkIn - breakMinutes
    const totalSpanMinutes = Math.max(
      0,
      Math.round((checkOutTime.getTime() - existing.checkIn.getTime()) / (60 * 1000))
    );
    const workingMinutes = Math.max(0, totalSpanMinutes - effectiveBreakMinutes);

    // Overtime: overtimeMinutes = max(workingMinutes - requiredWorkingMinutes, 0)
    const overtimeMinutes = Math.max(0, workingMinutes - requiredWorkingMinutes);

    // Update attendance
    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutTime,
        breakMinutes: effectiveBreakMinutes,
        workingMinutes,
        overtimeMinutes,
        notes: notes ? (existing.notes ? `${existing.notes}; ${notes}` : notes) : existing.notes,
      },
    });

    // Automatically register pending Overtime record if overtimeMinutes >= 30
    if (overtimeMinutes >= 30) {
      const hours = overtimeMinutes / 60;
      const ratePerHour = Number(defaultOtRate);
      const amount = Number((hours * ratePerHour).toFixed(2));

      await prisma.overtime.create({
        data: {
          employeeId,
          attendanceId: updated.id,
          date: today,
          minutes: overtimeMinutes,
          ratePerHour,
          amount,
          status: 'PENDING',
        },
      });
    }

    return updated;
  }
}

export const attendanceService = new AttendanceService();
