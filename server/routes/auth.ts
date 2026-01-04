import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/helpers';

const router = express.Router();

interface LoginBody {
    username: string;
    password: string;
}

interface RegisterBody {
    username: string;
    password: string;
    name: string;
}

// Login
router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { username: username }
        });

        if (user) {
            if (user.password === password) {
                await logAudit(username, 'LOGIN_SUCCESS', `User ${username} logged in successfully`, req);
                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        avatar: user.avatar
                    }
                });
            } else {
                await logAudit(username, 'LOGIN_FAILED', `Invalid password attempt for user ${username}`, req);
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            await logAudit(username || 'unknown', 'LOGIN_FAILED', `User not found: ${username}`, req);
            res.status(401).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register
router.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const { username, password, name } = req.body;
    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Tài khoản đã tồn tại' });
        }

        // Create user with default role 'PENDING'
        const newUser = await prisma.user.create({
            data: {
                username,
                password,
                name,
                role: 'PENDING' // Default role
            }
        });

        await logAudit(username, 'REGISTER_SUCCESS', `New user registered: ${username}`, req);

        res.json({
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                name: newUser.name
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
    }
});

export default router;
