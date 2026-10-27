import { Router } from 'express';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  toggleTaskStatus, 
  deleteTask 
} from '../controllers/taskController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/toggle', toggleTaskStatus);
router.delete('/:id', deleteTask);

export default router;