import { Router } from 'express';
import * as taskController from './task.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Standard Auth middleware direct lagaya taaki req.user strictly inject ho
router.get('/', authenticate, taskController.getTasks);
router.post('/', authenticate, taskController.createTask);
router.put('/:id', authenticate, taskController.updateTask);
if (typeof (taskController as any).toggleTaskStatus === 'function') {
  router.patch('/:id/toggle', authenticate, (taskController as any).toggleTaskStatus);
}
router.delete('/:id', authenticate, taskController.deleteTask);

export default router;