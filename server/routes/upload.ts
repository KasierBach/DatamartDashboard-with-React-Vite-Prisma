import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Encode filename to handle special characters effectively, then sanitize
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const sanitizedParams = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniquePrefix}-${sanitizedParams}`);
    }
});

// Filter file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];

    // Check if mimetype starts with any of the allowed types (to handle codecs=opus etc)
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));

    if (isAllowed) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed base types: ${allowedTypes.join(', ')}`));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload endpoint with local error handling
router.post('/', (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            console.error('UPLOAD: Multer/Filter error:', err);
            return res.status(500).json({
                error: err.message || 'Multer error',
                details: err.code || 'No details'
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const fileUrl = `/uploads/${req.file.filename}`;
            let fileType: 'image' | 'video' | 'file' = 'file';

            if (req.file.mimetype.startsWith('image/')) {
                fileType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
                fileType = 'video';
            }

            res.json({
                url: fileUrl,
                type: fileType,
                filename: req.file.filename,
                originalName: req.file.originalname
            });
        } catch (error: any) {
            console.error('UPLOAD: Logic error:', error);
            res.status(500).json({ error: 'Failed to process uploaded file', details: error.message });
        }
    });
});

export default router;
