import { Router } from 'express';
import { 
  getUserNotifications, 
  markNotificationsRead, 
  getUserSettings, 
  updateUserSettings 
} from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getUserNotifications);
router.put('/read', authenticateToken, markNotificationsRead);
router.get('/settings', authenticateToken, getUserSettings);
router.put('/settings', authenticateToken, updateUserSettings);

export default router;