import express from 'express';
import { returnBook, getMyBorrows, getAllBorrows } from '../controllers/borrowController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', verifyToken, getMyBorrows);
router.post('/:id/return', verifyToken, returnBook);
router.get('/', verifyToken, isAdmin, getAllBorrows);

export default router;
