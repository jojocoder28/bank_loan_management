import dbConnect from './mongodb';
import AuditLog from '@/models/auditLog';

/**
 * Logs an event to the system audit trail.
 * @param action Event identifier (e.g. LOAN_APPLIED)
 * @param actor Identifying string of the user performing the action
 * @param targetUser Optional MongoDB ID or object of the user affected
 * @param details Text description of the action
 * @param metadata Optional extra parameters logged as JSON
 */
export async function logAuditActivity(
    action: string,
    actor: string,
    targetUser?: any,
    details?: string,
    metadata?: Record<string, any>
) {
    try {
        await dbConnect();
        await AuditLog.create({
            action,
            actor,
            targetUser: targetUser || undefined,
            details: details || '',
            metadata: metadata ? JSON.stringify(metadata) : undefined,
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Failed to log audit activity:", error);
    }
}
