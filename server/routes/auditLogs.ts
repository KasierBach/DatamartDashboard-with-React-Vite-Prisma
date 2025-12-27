import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

// Get all audit logs
router.get('/', async (req: Request, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
            take: 100,
            orderBy: {
                created_at: 'desc'
            }
        });
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete single audit log
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.auditLog.delete({
            where: { id: parseInt(id) }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Clear all audit logs
router.delete('/', async (req: Request, res: Response) => {
    try {
        await prisma.auditLog.deleteMany();
        res.json({ success: true, message: 'All logs cleared' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
