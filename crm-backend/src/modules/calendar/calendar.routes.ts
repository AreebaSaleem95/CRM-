import { Router } from 'express';
import * as calendarController from './calendar.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

const auth = (req: any, res: any, next: any) => {
  if (typeof authenticate === 'function') return authenticate(req, res, next);
  next();
};

router.get('/', auth, calendarController.getCalendarEvents);
router.post('/', auth, calendarController.createCalendarEvent);
router.put('/:id', auth, calendarController.updateCalendarEvent);
router.delete('/:id', auth, calendarController.deleteCalendarEvent);

export default router;