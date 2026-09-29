import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/audit.service.js';
import { enforceEmployeeAccess } from '../middleware/auth.js';
import { hashPassword } from '../utils/jwtUtils.js';
import { Role, UserStatus, EmployeeStatus } from '@prisma/client';

export class EmployeeController {
  async getEmployees(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, departmentId, status } = req.query;

      const where: any = {};

      if (status) {
        where.status = status as EmployeeStatus;
      } else {
        where.status = { not: 'ARCHIVED' };
      }

      if (departmentId) {
        where.departmentId = Number(departmentId);
      }

      if (search) {
        where.OR = [
          { fullName: { contains: String(search) } },
          { employeeCode: { contains: String(search) } },
          { email: { contains: String(search) } },
          { designation: { contains: String(search) } },
        ];
      }

      const employees = await prisma.employee.findMany({
        where,
        include: {
          department: true,
          manager: { select: { id: true, fullName: true, employeeCode: true } },
          salaryStructures: {
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
          user: { select: { id: true, role: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, employees, 'Employees fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch employees', 500);
    }
  }

  async getEmployeeById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'Invalid employee ID', 400);
        return;
      }

      // Authorization & isolation check
      if (!enforceEmployeeAccess(id, req, res)) return;

      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          department: true,
          manager: { select: { id: true, fullName: true, employeeCode: true } },
          subordinates: { select: { id: true, fullName: true, employeeCode: true, designation: true } },
          salaryStructures: {
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
          leaveBalances: {
            include: { leaveType: true },
            where: { year: new Date().getFullYear() },
          },
          user: { select: { id: true, role: true, status: true } },
        },
      });

      if (!employee) {
        sendError(res, 'Employee not found', 404);
        return;
      }

      sendSuccess(res, employee, 'Employee details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch employee', 500);
    }
  }

  async createEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = req.body;

      // Unique email check
      const existingEmail = await prisma.employee.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        sendError(res, 'Email is already used by another employee', 409, 'EMAIL_EXISTS');
        return;
      }

      // Generate or validate employeeCode
      let employeeCode = data.employeeCode;
      if (!employeeCode) {
        const count = await prisma.employee.count();
        employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;
      } else {
        const existingCode = await prisma.employee.findUnique({ where: { employeeCode } });
        if (existingCode) {
          sendError(res, 'Employee code already exists', 409, 'CODE_EXISTS');
          return;
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.create({
          data: {
            employeeCode,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender || null,
            address: data.address || null,
            departmentId: data.departmentId || null,
            designation: data.designation,
            joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
            employmentType: data.employmentType || 'FULL_TIME',
            managerId: data.managerId || null,
            basicSalary: data.basicSalary,
            status: 'ACTIVE',
          },
        });

        // Create initial salary structure
        await tx.salaryStructure.create({
          data: {
            employeeId: emp.id,
            basicSalary: data.basicSalary,
            hra: data.hra ?? (data.basicSalary * 0.4), // Standard 40% HRA default
            travelAllowance: data.travelAllowance ?? 2000,
            medicalAllowance: data.medicalAllowance ?? 1500,
            otherAllowance: data.otherAllowance ?? 1000,
            overtimeRate: data.overtimeRate ?? 200,
            effectiveFrom: new Date(),
          },
        });

        // Initialize leave balances
        const currentYear = new Date().getFullYear();
        const leaveTypes = await tx.leaveType.findMany({ where: { status: 'ACTIVE' } });
        for (const lt of leaveTypes) {
          await tx.leaveBalance.create({
            data: {
              employeeId: emp.id,
              leaveTypeId: lt.id,
              year: currentYear,
              allocatedDays: lt.defaultDays,
              usedDays: 0,
              remainingDays: lt.defaultDays,
            },
          });
        }

        // If password is provided or role specified, create User account
        const userPassword = data.password || 'Employee@123';
        const passwordHash = await hashPassword(userPassword);
        const userRole = data.role && (data.role === Role.HR_MANAGER || data.role === Role.ADMIN)
          ? data.role
          : Role.EMPLOYEE;

        const user = await tx.user.create({
          data: {
            email: data.email,
            passwordHash,
            role: userRole,
            status: UserStatus.ACTIVE,
            employeeId: emp.id,
          },
        });

        await tx.employee.update({
          where: { id: emp.id },
          data: { userId: user.id },
        });

        return { emp, user };
      });

      await recordAuditLog({
        userId: req.user?.id,
        action: 'EMPLOYEE_CREATED',
        entity: 'Employee',
        entityId: String(result.emp.id),
        details: { employeeCode: result.emp.employeeCode, fullName: result.emp.fullName },
        ipAddress: req.ip,
      });

      sendSuccess(res, result.emp, 'Employee created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create employee', 500);
    }
  }

  async updateEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'Invalid employee ID', 400);
        return;
      }

      const existing = await prisma.employee.findUnique({ where: { id } });
      if (!existing) {
        sendError(res, 'Employee not found', 404);
        return;
      }

      const data = req.body;

      const updated = await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.update({
          where: { id },
          data: {
            fullName: data.fullName ?? existing.fullName,
            phone: data.phone ?? existing.phone,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : existing.dateOfBirth,
            gender: data.gender ?? existing.gender,
            address: data.address ?? existing.address,
            departmentId: data.departmentId ?? existing.departmentId,
            designation: data.designation ?? existing.designation,
            employmentType: data.employmentType ?? existing.employmentType,
            managerId: data.managerId !== undefined ? data.managerId : existing.managerId,
            basicSalary: data.basicSalary ?? existing.basicSalary,
            status: data.status ?? existing.status,
          },
          include: { department: true },
        });

        // Update salary structure if salary components changed
        if (data.basicSalary || data.hra !== undefined || data.overtimeRate !== undefined) {
          await tx.salaryStructure.create({
            data: {
              employeeId: id,
              basicSalary: data.basicSalary ?? existing.basicSalary,
              hra: data.hra ?? (Number(data.basicSalary || existing.basicSalary) * 0.4),
              travelAllowance: data.travelAllowance ?? 2000,
              medicalAllowance: data.medicalAllowance ?? 1500,
              otherAllowance: data.otherAllowance ?? 1000,
              overtimeRate: data.overtimeRate ?? 200,
              effectiveFrom: new Date(),
            },
          });
        }

        return emp;
      });

      await recordAuditLog({
        userId: req.user?.id,
        action: 'EMPLOYEE_UPDATED',
        entity: 'Employee',
        entityId: String(id),
        details: { changes: Object.keys(data) },
        ipAddress: req.ip,
      });

      sendSuccess(res, updated, 'Employee updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update employee', 500);
    }
  }

  async archiveEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'Invalid employee ID', 400);
        return;
      }

      // Soft delete: never physically delete if attendance or payroll records exist
      const employee = await prisma.employee.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      if (employee.userId) {
        await prisma.user.update({
          where: { id: employee.userId },
          data: { status: 'INACTIVE' },
        });
      }

      await recordAuditLog({
        userId: req.user?.id,
        action: 'EMPLOYEE_ARCHIVED',
        entity: 'Employee',
        entityId: String(id),
        ipAddress: req.ip,
      });

      sendSuccess(res, {}, 'Employee archived successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to archive employee', 500);
    }
  }

  async getDepartments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const departments = await prisma.department.findMany({
        include: { _count: { select: { employees: true } } },
      });
      sendSuccess(res, departments, 'Departments fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch departments', 500);
    }
  }
}

export const employeeController = new EmployeeController();
