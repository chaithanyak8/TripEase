import pool from '../db/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logActivity } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123!';

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
  }

  try {
    // Check if email already exists
    const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkRes.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const role = 'USER'; // Default role is USER

    const insertRes = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role]
    );

    const user = insertRes.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // Log activity to MongoDB
    await logActivity({
      userId: user.id,
      email: user.email,
      action: 'USER_REGISTERED',
      metadata: { name: user.name, role: user.role }
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      // Log failed login attempt
      await logActivity({
        email,
        action: 'USER_LOGIN_FAILED',
        metadata: { reason: 'Email not found' }
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await logActivity({
        userId: user.id,
        email: user.email,
        action: 'USER_LOGIN_FAILED',
        metadata: { reason: 'Incorrect password' }
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // Log successful login to MongoDB
    await logActivity({
      userId: user.id,
      email: user.email,
      action: 'USER_LOGIN',
      metadata: { name: user.name, role: user.role }
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const me = async (req, res) => {
  try {
    const userRes = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const user = userRes.rows[0];
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
