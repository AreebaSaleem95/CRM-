import { Router } from 'express';
import { handleFileUpload, uploadMiddleware } from '../controllers/uploadController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/document', authenticateToken, uploadMiddleware, handleFileUpload);

export default router;