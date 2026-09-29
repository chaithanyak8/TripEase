import pool from '../db/db.js';
import redisClient from '../db/redis.js';
import { logActivity } from '../utils/logger.js';

const BOOK_CACHE_KEY = 'cache:books:list';

const invalidateBookCache = async () => {
  if (redisClient.isOpen) {
    try {
      await redisClient.del(BOOK_CACHE_KEY);
      console.log('Redis book list cache invalidated.');
    } catch (error) {
      console.error('Failed to invalidate Redis cache:', error.message);
    }
  }
};

export const getAllBooks = async (req, res) => {
  try {
    // 1. Try to get from Redis cache
    if (redisClient.isOpen) {
      try {
        const cachedBooks = await redisClient.get(BOOK_CACHE_KEY);
        if (cachedBooks) {
          console.log('Cache Hit: Returning books from Redis');
          return res.status(200).json({ success: true, books: JSON.parse(cachedBooks), source: 'cache' });
        }
      } catch (cacheErr) {
        console.error('Redis read error:', cacheErr.message);
      }
    }

    // 2. Cache miss, query PostgreSQL
    console.log('Cache Miss: Querying PostgreSQL');
    const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
    const books = result.rows;

    // 3. Save to Redis cache for 1 hour (3600 seconds)
    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(BOOK_CACHE_KEY, 3600, JSON.stringify(books));
      } catch (cacheErr) {
        console.error('Redis write error:', cacheErr.message);
      }
    }

    res.status(200).json({ success: true, books, source: 'database' });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getBookById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    res.status(200).json({ success: true, book: result.rows[0] });
  } catch (error) {
    console.error('Get book by id error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createBook = async (req, res) => {
  const { title, author, isbn, description, total_copies } = req.body;

  if (!title || !author || !isbn || total_copies === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide title, author, isbn, and total_copies.' });
  }

  const parsedTotalCopies = parseInt(total_copies, 10);
  if (isNaN(parsedTotalCopies) || parsedTotalCopies < 0) {
    return res.status(400).json({ success: false, message: 'total_copies must be a non-negative integer.' });
  }

  try {
    // Check if ISBN is unique
    const checkRes = await pool.query('SELECT id FROM books WHERE isbn = $1', [isbn]);
    if (checkRes.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'ISBN already exists in the system.' });
    }

    const available_copies = parsedTotalCopies;

    const result = await pool.query(
      'INSERT INTO books (title, author, isbn, description, total_copies, available_copies) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, author, isbn, description || null, parsedTotalCopies, available_copies]
    );

    const newBook = result.rows[0];

    // Invalidate Cache
    await invalidateBookCache();

    // Log to MongoDB
    await logActivity({
      userId: req.user.id,
      action: 'BOOK_CREATED',
      bookId: newBook.id,
      bookTitle: newBook.title,
      metadata: { isbn: newBook.isbn, total_copies: newBook.total_copies }
    });

    res.status(201).json({ success: true, book: newBook });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, description, total_copies } = req.body;

  if (!title || !author || !isbn || total_copies === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide title, author, isbn, and total_copies.' });
  }

  const parsedTotalCopies = parseInt(total_copies, 10);
  if (isNaN(parsedTotalCopies) || parsedTotalCopies < 0) {
    return res.status(400).json({ success: false, message: 'total_copies must be a non-negative integer.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Select and lock the book row
    const bookRes = await client.query('SELECT * FROM books WHERE id = $1 FOR UPDATE', [id]);
    if (bookRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const currentBook = bookRes.rows[0];

    // Check if new ISBN is already taken by another book
    const isbnRes = await client.query('SELECT id FROM books WHERE isbn = $1 AND id != $2', [isbn, id]);
    if (isbnRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'ISBN is already in use by another book.' });
    }

    // Calculate new available copies based on current borrowed count
    const currentBorrowed = currentBook.total_copies - currentBook.available_copies;
    if (parsedTotalCopies < currentBorrowed) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total copies below currently borrowed copies (${currentBorrowed}).`
      });
    }

    const newAvailableCopies = parsedTotalCopies - currentBorrowed;

    const updateRes = await client.query(
      `UPDATE books 
       SET title = $1, author = $2, isbn = $3, description = $4, total_copies = $5, available_copies = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [title, author, isbn, description || null, parsedTotalCopies, newAvailableCopies, id]
    );

    const updatedBook = updateRes.rows[0];
    await client.query('COMMIT');

    // Invalidate Cache
    await invalidateBookCache();

    // Log to MongoDB
    await logActivity({
      userId: req.user.id,
      action: 'BOOK_UPDATED',
      bookId: updatedBook.id,
      bookTitle: updatedBook.title,
      metadata: { 
        old_total: currentBook.total_copies, 
        new_total: updatedBook.total_copies,
        old_available: currentBook.available_copies,
        new_available: updatedBook.available_copies
      }
    });

    res.status(200).json({ success: true, book: updatedBook });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update book error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

export const deleteBook = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the book
    const checkBook = await client.query('SELECT title FROM books WHERE id = $1 FOR UPDATE', [id]);
    if (checkBook.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const bookTitle = checkBook.rows[0].title;

    // Check if book has active borrow records
    const checkBorrow = await client.query(
      "SELECT 1 FROM borrow_records WHERE book_id = $1 AND status = 'BORROWED'",
      [id]
    );

    if (checkBorrow.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active borrow records. Please return all copies first.'
      });
    }

    await client.query('DELETE FROM books WHERE id = $1', [id]);
    await client.query('COMMIT');

    // Invalidate Cache
    await invalidateBookCache();

    // Log to MongoDB
    await logActivity({
      userId: req.user.id,
      action: 'BOOK_DELETED',
      bookId: id,
      bookTitle: bookTitle
    });

    res.status(200).json({ success: true, message: 'Book deleted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};
