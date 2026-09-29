import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
  designation: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const employeeCreateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
  designation: z.string().min(1),
  joiningDate: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  managerId: z.number().int().positive().optional(),
  basicSalary: z.number().positive(),
  employeeCode: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'EMPLOYEE']).optional(),
  hra: z.number().min(0).optional(),
  travelAllowance: z.number().min(0).optional(),
  medicalAllowance: z.number().min(0).optional(),
  otherAllowance: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional(),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

export const checkInSchema = z.object({
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  breakMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const leaveRequestSchema = z.object({
  leaveTypeId: z.number().int().positive(),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(),   // YYYY-MM-DD
  reason: z.string().min(3),
});

export const leaveRejectSchema = z.object({
  rejectionReason: z.string().min(3),
});

export const overtimeCreateSchema = z.object({
  attendanceId: z.number().int().positive().optional(),
  date: z.string(), // YYYY-MM-DD
  minutes: z.number().int().positive(),
  ratePerHour: z.number().positive().optional(),
});

export const salaryStructureSchema = z.object({
  basicSalary: z.number().positive(),
  hra: z.number().min(0).optional(),
  travelAllowance: z.number().min(0).optional(),
  medicalAllowance: z.number().min(0).optional(),
  otherAllowance: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional(),
  effectiveFrom: z.string().optional(),
});

export const payrollCalculateSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  employeeIds: z.array(z.number().int().positive()).optional(),
});

export const payrollProcessSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  employeeIds: z.array(z.number().int().positive()).optional(),
});

export const companySettingsSchema = z.object({
  companyName: z.string().min(1).optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().optional(),
  officeStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  officeEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  breakMinutes: z.number().int().min(0).optional(),
  requiredWorkingMinutes: z.number().int().positive().optional(),
  lateThresholdMinutes: z.number().int().min(0).optional(),
  defaultOvertimeRate: z.number().min(0).optional(),
});
