import express from 'express';
import { getAllBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/bookController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/', verifyToken, isAdmin, createBook);
router.put('/:id', verifyToken, isAdmin, updateBook);
router.delete('/:id', verifyToken, isAdmin, deleteBook);

export default router;
