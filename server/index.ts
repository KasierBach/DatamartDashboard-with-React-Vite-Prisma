import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import auditLogsRoutes from './routes/auditLogs';
import studentsRoutes from './routes/students';
import usersRoutes from './routes/users';
import messagesRoutes from './routes/messages';
import uploadRoutes from './routes/upload';

// Import socket initialization
import { initializeSocket } from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Socket.IO setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
initializeSocket(io);

// Start Server with HTTP server (for Socket.IO)
httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Socket.IO enabled`);
});
