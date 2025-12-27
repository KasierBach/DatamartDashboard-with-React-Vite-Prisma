import { Request } from 'express';
import prisma from './prisma';

// Helper to log audit events
export async function logAudit(
    username: string,
    action: string,
    details: string,
    req: Request
): Promise<void> {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    try {
        await prisma.auditLog.create({
            data: {
                username: username,
                action: action,
                details: details,
                ip_address: ip
            }
        });
    } catch (err) {
        console.error('Audit log error:', err);
    }
}
