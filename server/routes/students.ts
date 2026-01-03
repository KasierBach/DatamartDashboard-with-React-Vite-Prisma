import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

// Get student details (limited to 5000 by default for performance)
router.get('/', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5000;
        const students = await prisma.studentDetail.findMany({
            take: limit,
            orderBy: {
                id: 'asc'
            }
        });
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get province summaries
router.get('/provinces', async (req: Request, res: Response) => {
    try {
        const summaries = await prisma.provinceSummary.findMany({
            orderBy: {
                province: 'asc'
            }
        });
        res.json(summaries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get school summaries
router.get('/schools', async (req: Request, res: Response) => {
    try {
        const summaries = await prisma.schoolSummary.findMany({
            orderBy: {
                school_name: 'asc'
            }
        });
        res.json(summaries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
