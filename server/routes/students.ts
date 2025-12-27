import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

// Get all students
router.get('/', async (req: Request, res: Response) => {
    try {
        const students = await prisma.factScore.findMany({
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

export default router;
