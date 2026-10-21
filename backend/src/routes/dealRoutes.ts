import { Router } from 'express';
import { getDeals, createDeal, updateDeal, deleteDeal } from '../controllers/dealController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getDeals);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;