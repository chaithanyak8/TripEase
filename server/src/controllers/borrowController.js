import pool from '../db/db.js';
import { logActivity } from '../utils/logger.js';
import { invalidateBookCache } from './bookController.js';

export const borrowBook = async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if the user already has an active borrow for this book
    const checkBorrowRes = await client.query(
      "SELECT id FROM borrow_records WHERE user_id = $1 AND book_id = $2 AND status = 'BORROWED' FOR UPDATE",
      [userId, bookId]
    );

    if (checkBorrowRes.rows.length > 0) {
      await client.query('ROLLBACK');
      
      // Log failed attempt to MongoDB
      await logActivity({
        userId,
        action: 'BORROW_FAILED',
        bookId,
        metadata: { reason: 'Duplicate borrowing of same book' }
      });

      return res.status(400).json({
        success: false,
        message: 'A user cannot have more than one active borrow for the same book.'
      });
    }

    // 2. Lock the book row and check availability
    const bookRes = await client.query(
      'SELECT id, title, available_copies, total_copies FROM books WHERE id = $1 FOR UPDATE',
      [bookId]
    );

    if (bookRes.rows.length === 0) {
      await client.query('ROLLBACK');
      
      await logActivity({
        userId,
        action: 'BORROW_FAILED',
        bookId,
        metadata: { reason: 'Book not found' }
      });

      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    const book = bookRes.rows[0];

    // Concurrency requirement validation
    if (book.available_copies <= 0) {
      await client.query('ROLLBACK');

      // Log failure to MongoDB
      await logActivity({
        userId,
        action: 'BORROW_FAILED',
        bookId: book.id,
        bookTitle: book.title,
        metadata: { reason: 'No copies available' }
      });

      return res.status(409).json({
        success: false,
        message: 'No copies available for this book.'
      });
    }

    // 3. Create borrow record
    const insertBorrowRes = await client.query(
      "INSERT INTO borrow_records (user_id, book_id, status) VALUES ($1, $2, 'BORROWED') RETURNING *",
      [userId, bookId]
    );

    // 4. Decrease available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1, updated_at = NOW() WHERE id = $1',
      [bookId]
    );

    await client.query('COMMIT');

    // Invalidate book list cache
    await invalidateBookCache();

    // Log successful borrow to MongoDB
    await logActivity({
      userId,
      action: 'BOOK_BORROWED',
      bookId: book.id,
      bookTitle: book.title,
      metadata: { borrowRecordId: insertBorrowRes.rows[0].id }
    });

    res.status(200).json({
      success: true,
      message: 'Book borrowed successfully.',
      record: insertBorrowRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Borrow book error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

export const returnBook = async (req, res) => {
  const borrowRecordId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock the borrow record row for update
    const borrowRes = await client.query(
      'SELECT * FROM borrow_records WHERE id = $1 FOR UPDATE',
      [borrowRecordId]
    );

    if (borrowRes.rows.length === 0) {
      await client.query('ROLLBACK');
      
      await logActivity({
        userId,
        action: 'RETURN_FAILED',
        metadata: { borrowRecordId, reason: 'Borrow record not found' }
      });

      return res.status(404).json({
        success: false,
        message: 'Borrow record not found.'
      });
    }

    const record = borrowRes.rows[0];

    // 2. Validate ownership (Admins can return any book, Users only their own)
    if (userRole !== 'ADMIN' && record.user_id !== userId) {
      await client.query('ROLLBACK');
      
      await logActivity({
        userId,
        action: 'RETURN_FAILED',
        metadata: { borrowRecordId, reason: 'Unauthorized return attempt' }
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only return books you borrowed.'
      });
    }

    // 3. Verify that the book has not already been returned
    if (record.status === 'RETURNED') {
      await client.query('ROLLBACK');

      await logActivity({
        userId,
        action: 'RETURN_FAILED',
        metadata: { borrowRecordId, reason: 'Book already returned' }
      });

      return res.status(400).json({
        success: false,
        message: 'This book has already been returned.'
      });
    }

    // 4. Lock the book row for update
    const bookRes = await client.query(
      'SELECT id, title, available_copies, total_copies FROM books WHERE id = $1 FOR UPDATE',
      [record.book_id]
    );

    if (bookRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Associated book not found.'
      });
    }

    const book = bookRes.rows[0];

    // 5. Safety check: ensure available copies does not exceed total copies
    if (book.available_copies + 1 > book.total_copies) {
      await client.query('ROLLBACK');
      
      await logActivity({
        userId,
        action: 'RETURN_FAILED',
        bookId: book.id,
        bookTitle: book.title,
        metadata: { borrowRecordId, reason: 'Available copies exceeds total copies' }
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid return. Available copies would exceed total copies.'
      });
    }

    // 6. Mark borrow record as returned
    const updateRecordRes = await client.query(
      "UPDATE borrow_records SET status = 'RETURNED', returned_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
      [borrowRecordId]
    );

    // 7. Increase available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = $1',
      [record.book_id]
    );

    await client.query('COMMIT');

    // Invalidate book list cache
    await invalidateBookCache();

    // Log successful return to MongoDB
    await logActivity({
      userId,
      action: 'BOOK_RETURNED',
      bookId: book.id,
      bookTitle: book.title,
      metadata: { borrowRecordId }
    });

    res.status(200).json({
      success: true,
      message: 'Book returned successfully.',
      record: updateRecordRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Return book error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

export const getMyBorrows = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT br.*, b.title, b.author, b.isbn, b.description 
       FROM borrow_records br 
       JOIN books b ON br.book_id = b.id 
       WHERE br.user_id = $1 
       ORDER BY br.borrowed_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, records: result.rows });
  } catch (error) {
    console.error('Get my borrows error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getAllBorrows = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, u.name as user_name, u.email as user_email, 
              b.title as book_title, b.author as book_author, b.isbn as book_isbn 
       FROM borrow_records br 
       JOIN users u ON br.user_id = u.id 
       JOIN books b ON br.book_id = b.id 
       ORDER BY br.borrowed_at DESC`
    );
    res.status(200).json({ success: true, records: result.rows });
  } catch (error) {
    console.error('Get all borrows error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
