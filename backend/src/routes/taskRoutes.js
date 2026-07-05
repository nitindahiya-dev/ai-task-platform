import express from 'express';
import { createTask, getTasks, getTask } from '../controllers/taskController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply authMiddleware to all task routes
router.use(authMiddleware);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTask);

export default router;
