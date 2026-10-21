import { Router } from 'express';
import { getDeals, createDeal, updateDeal, deleteDeal, getSalesAgents } from '../controllers/dealController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/agents', authenticateToken, getSalesAgents); // Sales team list
router.get('/', authenticateToken, getDeals);
router.post('/', authenticateToken, createDeal);
router.put('/:id', authenticateToken, updateDeal);
router.delete('/:id', authenticateToken, deleteDeal);

export default router;