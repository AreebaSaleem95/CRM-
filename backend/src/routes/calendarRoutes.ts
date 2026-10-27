import { Router } from 'express';
import { 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent,
  deleteCalendarEvent 
} from '../controllers/calendarController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getCalendarEvents);
router.post('/', createCalendarEvent);
router.put('/:id', updateCalendarEvent);
router.delete('/:id', deleteCalendarEvent);

export default router;