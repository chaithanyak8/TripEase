import { prisma } from '../prisma/client.js';

export interface AuditLogEntry {
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}

export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    let sanitizedDetails: string | undefined = undefined;
    if (entry.details) {
      // sanitize sensitive fields
      const clean = { ...entry.details };
      delete clean.password;
      delete clean.passwordHash;
      delete clean.token;
      delete clean.secret;
      sanitizedDetails = JSON.stringify(clean);
    }

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ? String(entry.entityId) : null,
        details: sanitizedDetails,
        ipAddress: entry.ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
