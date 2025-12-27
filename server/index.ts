import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import auditLogsRoutes from './routes/auditLogs';
import studentsRoutes from './routes/students';
import usersRoutes from './routes/users';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
// (Prisma handles this automatically on first request)

// Routes
app.use('/api', authRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
