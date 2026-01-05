import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

// Get student details (with server-side pagination, filtering, and sorting)
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const search = req.query.search as string || '';
        const sortField = req.query.sortField as string || 'id';
        const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';
        const status = req.query.status as string || 'all';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { student_uid: { contains: search, mode: 'insensitive' } },
                { school_name: { contains: search, mode: 'insensitive' } },
                { province_name: { contains: search, mode: 'insensitive' } },
                { grade: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Note: 'status' isn't explicitly in StudentDetail model based on schema.prisma
        // but it's used in frontend. If it was mapped to academic_tier or similar, we'd add it.
        // For now, if academic_tier is what was meant by status:
        // if (status !== 'all') {
        //     where.academic_tier = status;
        // }

        const [students, total] = await Promise.all([
            prisma.studentDetail.findMany({
                where,
                take: limit,
                skip: skip,
                orderBy: {
                    [sortField]: sortOrder
                }
            }),
            prisma.studentDetail.count({ where })
        ]);

        res.json({
            data: students,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
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
