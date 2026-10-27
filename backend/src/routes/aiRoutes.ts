import { Router } from 'express';
import { generateDealPitch } from '../controllers/aiController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Protected AI endpoint
router.post('/deal-pitch', authenticateToken, generateDealPitch);

export default router;