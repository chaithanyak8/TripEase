import express from 'express';
import { getActivityLogs } from '../controllers/activityController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, isAdmin, getActivityLogs);

export default router;
