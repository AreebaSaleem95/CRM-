import { Router } from 'express';
import * as dealController from './deal.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Standard Auth middleware direct lagaya taaki req.user strictly inject ho
router.get('/agents', authenticate, dealController.getSalesAgents);
router.get('/', authenticate, dealController.getDeals);
router.post('/', authenticate, dealController.createDeal);
router.put('/:id', authenticate, dealController.updateDeal);
router.delete('/:id', authenticate, dealController.deleteDeal);

export default router;